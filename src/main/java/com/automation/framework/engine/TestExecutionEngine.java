package com.automation.framework.engine;

import com.automation.framework.entity.TestCase;
import com.automation.framework.repository.TestSuiteRepository;
import com.automation.framework.service.TestCaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TestExecutionEngine {

	private static final Logger log = LoggerFactory.getLogger(TestExecutionEngine.class);

	public record SuiteRunResult(int total, int passed, int failed) {
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
		log.info("Engine: starting suite id={}, testCaseCount={}", suiteId, cases.size());

		int passed = 0;
		int failed = 0;

		for (TestCase testCase : cases) {
			String rawType = testCase.getType();
			String type = rawType != null ? rawType.trim().toUpperCase() : "";
			log.info("Engine: running testCase id={}, name={}, type={}", testCase.getId(), testCase.getName(), rawType);

			boolean ok;
			try {
				ok = switch (type) {
					case "UI" -> seleniumTestRunner.runSampleUiTest();
					case "API" -> apiTestRunner.runSampleApiTest();
					default -> {
						log.warn("Engine: unknown type '{}', marking FAIL", rawType);
						yield false;
					}
				};
			} catch (Exception e) {
				log.error("Engine: unexpected error for testCase id={}", testCase.getId(), e);
				ok = false;
			}

			String newStatus = ok ? "PASS" : "FAIL";
			testCaseService.updateStatus(testCase.getId(), newStatus);
			if (ok) {
				passed++;
			} else {
				failed++;
			}
			log.info("Engine: testCase id={} finished with status={}", testCase.getId(), newStatus);
		}

		log.info("Engine: suite id={} completed total={}, passed={}, failed={}", suiteId, cases.size(), passed, failed);
		return new SuiteRunResult(cases.size(), passed, failed);
	}
}
