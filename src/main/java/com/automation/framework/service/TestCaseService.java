package com.automation.framework.service;

import com.automation.framework.engine.SeleniumTestUtil;
import com.automation.framework.entity.TestCase;
import com.automation.framework.entity.TestSuite;
import com.automation.framework.repository.TestCaseRepository;
import com.automation.framework.repository.TestSuiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TestCaseService {

	private final TestCaseRepository testCaseRepository;
	private final TestSuiteRepository testSuiteRepository;
	private final SeleniumTestUtil seleniumTestUtil;

	public TestCaseService(TestCaseRepository testCaseRepository, TestSuiteRepository testSuiteRepository,
			SeleniumTestUtil seleniumTestUtil) {
		this.testCaseRepository = testCaseRepository;
		this.testSuiteRepository = testSuiteRepository;
		this.seleniumTestUtil = seleniumTestUtil;
	}

	@Transactional
	public TestCase create(TestCase testCase, Long testSuiteId) {
		TestSuite suite = testSuiteRepository.findById(testSuiteId)
				.orElseThrow(() -> new IllegalArgumentException("TestSuite not found: " + testSuiteId));
		testCase.setTestSuite(suite);
		suite.getTestCases().add(testCase);
		return testCaseRepository.save(testCase);
	}

	@Transactional(readOnly = true)
	public List<TestCase> getAll() {
		return testCaseRepository.findAll();
	}

	@Transactional(readOnly = true)
	public Optional<TestCase> getById(Long id) {
		return testCaseRepository.findById(id);
	}

	@Transactional(readOnly = true)
	public List<TestCase> getBySuiteId(Long suiteId) {
		return testCaseRepository.findByTestSuite_Id(suiteId);
	}

	@Transactional
	public TestCase updateStatus(Long id, String status) {
		TestCase tc = testCaseRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("TestCase not found: " + id));
		tc.setStatus(status);
		return testCaseRepository.save(tc);
	}

	@Transactional
	public TestCase update(Long id, String name, String description, String type, String status, Long testSuiteId,
			String url, String expectedTitle) {
		TestCase tc = testCaseRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("TestCase not found: " + id));

		if (name != null) {
			tc.setName(name);
		}
		if (description != null) {
			tc.setDescription(description);
		}
		if (type != null) {
			tc.setType(type);
		}
		if (status != null) {
			tc.setStatus(status);
		}
		if (url != null) {
			tc.setUrl(url);
		}
		if (expectedTitle != null) {
			tc.setExpectedTitle(expectedTitle);
		}
		if (testSuiteId != null && (tc.getTestSuite() == null || !testSuiteId.equals(tc.getTestSuite().getId()))) {
			TestSuite targetSuite = testSuiteRepository.findById(testSuiteId)
					.orElseThrow(() -> new IllegalArgumentException("TestSuite not found: " + testSuiteId));
			if (tc.getTestSuite() != null) {
				tc.getTestSuite().getTestCases().remove(tc);
			}
			tc.setTestSuite(targetSuite);
			targetSuite.getTestCases().add(tc);
		}

		return testCaseRepository.save(tc);
	}

	/**
	 * Runs automation for one test case: loads it from DB, executes Selenium when type is UI,
	 * sets {@code status} to PASS or FAIL, and persists.
	 */
	@Transactional
	public TestCase executeTest(Long id) {
		TestCase tc = testCaseRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("TestCase not found: " + id));

		String type = tc.getType() != null ? tc.getType().trim().toUpperCase() : "";
		if (!"UI".equals(type)) {
			throw new IllegalArgumentException("executeTest only supports type UI; got: " + tc.getType());
		}
		if (tc.getUrl() == null || tc.getUrl().isBlank()
				|| tc.getExpectedTitle() == null || tc.getExpectedTitle().isBlank()) {
			throw new IllegalArgumentException("UI test requires url and expectedTitle to be set on the test case");
		}

		SeleniumTestUtil.UiTestRunResult result = seleniumTestUtil.runTest(tc.getId(), tc.getUrl().trim(),
				tc.getExpectedTitle().trim());
		tc.setStatus(result.pass() ? "PASS" : "FAIL");
		return testCaseRepository.save(tc);
	}

	@Transactional
	public void delete(Long id) {
		testCaseRepository.deleteById(id);
	}
}
