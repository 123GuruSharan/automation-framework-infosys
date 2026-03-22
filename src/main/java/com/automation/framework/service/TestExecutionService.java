package com.automation.framework.service;

import com.automation.framework.engine.TestExecutionEngine;
import com.automation.framework.engine.TestExecutionEngine.SuiteRunResult;
import com.automation.framework.engine.TestExecutionEngine.TestCaseRunDetail;
import com.automation.framework.entity.TestCaseExecutionResult;
import com.automation.framework.entity.TestExecution;
import com.automation.framework.entity.TestSuite;
import com.automation.framework.repository.TestCaseExecutionResultRepository;
import com.automation.framework.repository.TestExecutionRepository;
import com.automation.framework.repository.TestSuiteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class TestExecutionService {

	private static final Logger log = LoggerFactory.getLogger(TestExecutionService.class);

	public record ExecutionReportRow(String testCaseName, String status, long durationMs, LocalDateTime startedAt,
			LocalDateTime endedAt, String screenshotPath) {
	}

	public record ExecutionReportResponse(long executionId, long suiteDurationMs, List<ExecutionReportRow> rows) {
	}

	private final TestExecutionRepository testExecutionRepository;
	private final TestSuiteRepository testSuiteRepository;
	private final TestCaseExecutionResultRepository testCaseExecutionResultRepository;
	private final TestExecutionEngine testExecutionEngine;
	private final TransactionTemplate transactionTemplate;

	public TestExecutionService(TestExecutionRepository testExecutionRepository,
			TestSuiteRepository testSuiteRepository, TestCaseExecutionResultRepository testCaseExecutionResultRepository,
			TestExecutionEngine testExecutionEngine, PlatformTransactionManager transactionManager) {
		this.testExecutionRepository = testExecutionRepository;
		this.testSuiteRepository = testSuiteRepository;
		this.testCaseExecutionResultRepository = testCaseExecutionResultRepository;
		this.testExecutionEngine = testExecutionEngine;
		this.transactionTemplate = new TransactionTemplate(transactionManager);
	}

	@Transactional
	public TestExecution create(TestExecution execution) {
		if (execution.getTestSuite() == null || execution.getTestSuite().getId() == null) {
			throw new IllegalArgumentException("TestSuite id is required");
		}
		Long suiteId = execution.getTestSuite().getId();
		TestSuite suite = testSuiteRepository.findById(suiteId)
				.orElseThrow(() -> new IllegalArgumentException("TestSuite not found: " + suiteId));
		execution.setTestSuite(suite);
		if (execution.getExecutionTime() == null) {
			execution.setExecutionTime(LocalDateTime.now());
		}
		return testExecutionRepository.save(execution);
	}

	public TestExecution start(Long testSuiteId, String clientStatus, int clientTotal, int clientPassed,
			int clientFailed) {
		TestSuite suite = testSuiteRepository.findById(testSuiteId)
				.orElseThrow(() -> new IllegalArgumentException("TestSuite not found: " + testSuiteId));

		log.info(
				"Execution start requested: suiteId={}, clientStatus={}, clientTotals total={}/passed={}/failed={}",
				testSuiteId, clientStatus, clientTotal, clientPassed, clientFailed);

		TestExecution initial = new TestExecution();
		initial.setTestSuite(suite);
		initial.setExecutionTime(LocalDateTime.now());
		initial.setStatus("RUNNING");
		initial.setTotalTests(0);
		initial.setPassedTests(0);
		initial.setFailedTests(0);
		initial.setDurationMs(null);

		Long executionId = transactionTemplate.execute(status -> testExecutionRepository.save(initial).getId());

		try {
			SuiteRunResult result = testExecutionEngine.runTestSuite(testSuiteId);
			log.info("Execution engine finished: suiteId={}, total={}, passed={}, failed={}, suiteDurationMs={}",
					testSuiteId, result.total(), result.passed(), result.failed(), result.suiteDurationMs());

			return transactionTemplate.execute(status -> {
				TestExecution ex = testExecutionRepository.findById(executionId)
						.orElseThrow(() -> new IllegalStateException("TestExecution missing: " + executionId));
				ex.setTotalTests(result.total());
				ex.setPassedTests(result.passed());
				ex.setFailedTests(result.failed());
				ex.setDurationMs(result.suiteDurationMs());
				ex.setStatus("COMPLETED");
				testExecutionRepository.save(ex);
				for (TestCaseRunDetail d : result.details()) {
					TestCaseExecutionResult row = new TestCaseExecutionResult();
					row.setTestExecution(ex);
					row.setTestCaseId(d.testCaseId());
					row.setTestCaseName(d.testCaseName());
					row.setStatus(d.status());
					row.setStartedAt(d.startedAt());
					row.setEndedAt(d.endedAt());
					row.setDurationMs(d.durationMs());
					row.setScreenshotPath(d.screenshotPath());
					testCaseExecutionResultRepository.save(row);
				}
				log.info("Execution persisted: id={}, status={}, total={}, passed={}, failed={}, durationMs={}",
						ex.getId(), ex.getStatus(), ex.getTotalTests(), ex.getPassedTests(), ex.getFailedTests(),
						ex.getDurationMs());
				return ex;
			});
		} catch (Exception e) {
			log.error("Execution engine failed: suiteId={}, executionId={}", testSuiteId, executionId, e);
			return transactionTemplate.execute(status -> {
				TestExecution ex = testExecutionRepository.findById(executionId)
						.orElseThrow(() -> new IllegalStateException("TestExecution missing: " + executionId));
				ex.setStatus("ERROR");
				return testExecutionRepository.save(ex);
			});
		}
	}

	@Transactional(readOnly = true)
	public ExecutionReportResponse getExecutionReport(Long executionId) {
		TestExecution ex = testExecutionRepository.findById(executionId)
				.orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "TestExecution not found: " + executionId));
		long suiteDurationMs = ex.getDurationMs() != null ? ex.getDurationMs() : 0L;
		List<TestCaseExecutionResult> rows = testCaseExecutionResultRepository
				.findByTestExecution_IdOrderByIdAsc(executionId);
		List<ExecutionReportRow> mapped = rows.stream()
				.map(r -> new ExecutionReportRow(r.getTestCaseName(), r.getStatus(), r.getDurationMs(),
						r.getStartedAt(), r.getEndedAt(), r.getScreenshotPath()))
				.toList();
		return new ExecutionReportResponse(ex.getId(), suiteDurationMs, mapped);
	}

	@Transactional(readOnly = true)
	public List<TestExecution> getAll() {
		return testExecutionRepository.findAll();
	}

	@Transactional(readOnly = true)
	public Optional<TestExecution> getById(Long id) {
		return testExecutionRepository.findById(id);
	}

	@Transactional
	public void delete(Long id) {
		testExecutionRepository.deleteById(id);
	}
}
