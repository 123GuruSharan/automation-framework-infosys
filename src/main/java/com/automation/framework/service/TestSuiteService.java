package com.automation.framework.service;

import com.automation.framework.entity.TestSuite;
import com.automation.framework.repository.TestSuiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TestSuiteService {

	private final TestSuiteRepository testSuiteRepository;

	public TestSuiteService(TestSuiteRepository testSuiteRepository) {
		this.testSuiteRepository = testSuiteRepository;
	}

	@Transactional
	public TestSuite create(TestSuite testSuite) {
		return testSuiteRepository.save(testSuite);
	}

	@Transactional(readOnly = true)
	public List<TestSuite> getAll() {
		return testSuiteRepository.findAll();
	}

	@Transactional(readOnly = true)
	public Optional<TestSuite> getById(Long id) {
		return testSuiteRepository.findById(id);
	}

	@Transactional
	public void delete(Long id) {
		testSuiteRepository.deleteById(id);
	}
}
