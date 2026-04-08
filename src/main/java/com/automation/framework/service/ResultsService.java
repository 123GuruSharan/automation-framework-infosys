package com.automation.framework.service;

import com.automation.framework.entity.TestExecution;
import com.automation.framework.entity.TestSuite;
import com.automation.framework.repository.TestExecutionRepository;
import com.automation.framework.repository.TestSuiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ResultsService {

	public record SuiteExecutionRow(long id, LocalDateTime executionTime, String status, int totalTests,
			int passedTests, int failedTests, Long durationMs) {
	}

	public record SuiteResultsResponse(long suiteId, String suiteName, String suiteDescription, long totalExecutions,
			double overallPassRate, LocalDateTime lastExecutionAt, List<SuiteExecutionRow> recentExecutions) {
	}

	private final TestSuiteRepository testSuiteRepository;
	private final TestExecutionRepository testExecutionRepository;

	public ResultsService(TestSuiteRepository testSuiteRepository, TestExecutionRepository testExecutionRepository) {
		this.testSuiteRepository = testSuiteRepository;
		this.testExecutionRepository = testExecutionRepository;
	}

	@Transactional(readOnly = true)
	public SuiteResultsResponse getSuiteResults(Long suiteId, int limit) {
		TestSuite suite = testSuiteRepository.findById(suiteId)
				.orElseThrow(() -> new IllegalArgumentException("TestSuite not found: " + suiteId));
		int cap = Math.min(Math.max(limit, 1), 100);
		List<TestExecution> all = testExecutionRepository.findByTestSuite_IdOrderByExecutionTimeDesc(suiteId);
		List<TestExecution> recent = all.stream().limit(cap).toList();
		long totalRuns = all.size();
		List<TestExecution> completed = all.stream()
				.filter(ex -> "COMPLETED".equalsIgnoreCase(ex.getStatus()))
				.toList();
		int sumPassed = completed.stream().mapToInt(TestExecution::getPassedTests).sum();
		int sumTotal = completed.stream().mapToInt(TestExecution::getTotalTests).sum();
		double passRate = sumTotal > 0 ? round2((sumPassed * 100.0) / sumTotal) : 0.0;
		LocalDateTime lastAt = all.isEmpty() ? null : all.get(0).getExecutionTime();
		List<SuiteExecutionRow> rows = recent.stream()
				.map(ex -> new SuiteExecutionRow(ex.getId(), ex.getExecutionTime(), ex.getStatus(),
						ex.getTotalTests(), ex.getPassedTests(), ex.getFailedTests(), ex.getDurationMs()))
				.toList();
		return new SuiteResultsResponse(suite.getId(), suite.getName(), suite.getDescription(), totalRuns, passRate,
				lastAt, rows);
	}

	private double round2(double value) {
		return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
	}
}
