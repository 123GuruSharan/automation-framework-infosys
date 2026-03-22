package com.automation.framework.engine;

import com.automation.framework.entity.TestCase;
import com.automation.framework.repository.TestSuiteRepository;
import com.automation.framework.service.TestCaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

@Service
public class TestExecutionEngine {

	private static final Logger log = LoggerFactory.getLogger(TestExecutionEngine.class);

	private static final int POOL_SIZE = 5;

	public record TestCaseRunDetail(Long testCaseId, String testCaseName, String status, long durationMs,
			LocalDateTime startedAt, LocalDateTime endedAt, String screenshotPath) {
	}

	public record SuiteRunResult(int total, int passed, int failed, long suiteDurationMs,
			List<TestCaseRunDetail> details) {
	}

	private record TestCaseOutcome(Long id, String name, boolean pass, long durationMs, LocalDateTime startedAt,
			LocalDateTime endedAt, String screenshotPath) {
	}

	private final TestSuiteRepository testSuiteRepository;
	private final TestCaseService testCaseService;
	private final SeleniumTestRunner seleniumTestRunner;
	private final ApiTestRunner apiTestRunner;

	public TestExecutionEngine(TestSuiteRepository testSuiteRepository, TestCaseService testCaseService,
			SeleniumTestRunner seleniumTestRunner, ApiTestRunner apiTestRunner) {
		this.testSuiteRepository = testSuiteRepository;
		this.testCaseService = testCaseService;
		this.seleniumTestRunner = seleniumTestRunner;
		this.apiTestRunner = apiTestRunner;
	}

	public SuiteRunResult runTestSuite(Long suiteId) {
		testSuiteRepository.findById(suiteId)
				.orElseThrow(() -> new IllegalArgumentException("TestSuite not found: " + suiteId));

		List<TestCase> cases = testCaseService.getBySuiteId(suiteId);
		log.info("Engine: starting suite id={}, testCaseCount={}, parallel poolSize={}", suiteId, cases.size(),
				POOL_SIZE);

		Instant suiteStart = Instant.now();
		ExecutorService executor = Executors.newFixedThreadPool(POOL_SIZE);
		try {
			List<Future<TestCaseOutcome>> futures = new ArrayList<>(cases.size());
			for (TestCase testCase : cases) {
				final Long caseId = testCase.getId();
				final String caseName = testCase.getName();
				final String rawType = testCase.getType();
				futures.add(executor.submit(() -> executeSingleTestCase(caseId, caseName, rawType)));
			}

			int passed = 0;
			int failed = 0;
			List<TestCaseRunDetail> details = new ArrayList<>(cases.size());
			for (Future<TestCaseOutcome> future : futures) {
				TestCaseOutcome outcome;
				try {
					outcome = future.get();
				} catch (InterruptedException e) {
					Thread.currentThread().interrupt();
					throw new IllegalStateException("Suite execution interrupted", e);
				} catch (ExecutionException e) {
					Throwable cause = e.getCause() != null ? e.getCause() : e;
					throw new IllegalStateException("Parallel test task failed: " + cause.getMessage(), cause);
				}
				String status = outcome.pass() ? "PASS" : "FAIL";
				testCaseService.updateStatus(outcome.id(), status);
				if (outcome.pass()) {
					passed++;
				} else {
					failed++;
				}
				details.add(new TestCaseRunDetail(outcome.id(), outcome.name(), status, outcome.durationMs(),
						outcome.startedAt(), outcome.endedAt(), outcome.screenshotPath()));
				log.info("Engine: persisted outcome thread=main testCaseId={} name=\"{}\" status={} durationMs={}",
						outcome.id(), outcome.name(), status, outcome.durationMs());
			}

			Instant suiteEnd = Instant.now();
			long suiteDurationMs = Duration.between(suiteStart, suiteEnd).toMillis();
			log.info("Engine: suite id={} completed total={}, passed={}, failed={}, suiteDurationMs={}", suiteId,
					cases.size(), passed, failed, suiteDurationMs);
			return new SuiteRunResult(cases.size(), passed, failed, suiteDurationMs, List.copyOf(details));
		} finally {
			shutdownExecutor(executor);
		}
	}

	private TestCaseOutcome executeSingleTestCase(Long id, String name, String rawType) {
		String threadName = Thread.currentThread().getName();
		String type = rawType != null ? rawType.trim().toUpperCase() : "";

		Instant start = Instant.now();
		LocalDateTime startedAt = LocalDateTime.ofInstant(start, ZoneId.systemDefault());

		boolean ok;
		String screenshotPath = null;
		try {
			ok = switch (type) {
				case "UI" -> {
					SeleniumTestRunner.UiTestResult ui = seleniumTestRunner.runSampleUiTest(name);
					screenshotPath = ui.failureScreenshotPath();
					yield ui.pass();
				}
				case "API" -> apiTestRunner.runSampleApiTest();
				default -> {
					log.warn("Engine: unknown type '{}', marking FAIL (thread={})", rawType, threadName);
					yield false;
				}
			};
		} catch (Exception e) {
			log.error("Engine: unexpected error (thread={}) testCase id={} name={}", threadName, id, name, e);
			ok = false;
		}

		Instant end = Instant.now();
		LocalDateTime endedAt = LocalDateTime.ofInstant(end, ZoneId.systemDefault());
		long durationMs = Duration.between(start, end).toMillis();

		String resultLabel = ok ? "PASS" : "FAIL";
		log.info("Engine: thread={} testName=\"{}\" testCaseId={} result={} durationMs={} started={} ended={}",
				threadName, name, id, resultLabel, durationMs, startedAt, endedAt);

		return new TestCaseOutcome(id, name, ok, durationMs, startedAt, endedAt, screenshotPath);
	}

	private void shutdownExecutor(ExecutorService executor) {
		executor.shutdown();
		try {
			if (!executor.awaitTermination(2, TimeUnit.HOURS)) {
				log.warn("Engine: executor did not finish within timeout; forcing shutdownNow()");
				executor.shutdownNow();
				if (!executor.awaitTermination(1, TimeUnit.MINUTES)) {
					log.error("Engine: executor did not terminate after shutdownNow()");
				}
			}
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			executor.shutdownNow();
			log.warn("Engine: interrupted while shutting down executor");
		}
	}
}
