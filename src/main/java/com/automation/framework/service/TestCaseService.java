package com.automation.framework.service;

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

	public TestCaseService(TestCaseRepository testCaseRepository, TestSuiteRepository testSuiteRepository) {
		this.testCaseRepository = testCaseRepository;
		this.testSuiteRepository = testSuiteRepository;
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
	public void delete(Long id) {
		testCaseRepository.deleteById(id);
	}
}
