package com.automation.framework.service;

import com.automation.framework.entity.TestCaseExecutionResult;
import com.automation.framework.entity.TestExecution;
import com.automation.framework.repository.TestCaseExecutionResultRepository;
import com.automation.framework.repository.TestExecutionRepository;
import com.automation.framework.repository.TestSuiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

	public record TrendPoint(LocalDate date, int total, int passed, int failed, double passRate, long avgDurationMs) {
	}

	public record FailureHotspot(String testCaseName, long failureCount) {
	}

	public record AnalyticsResponse(Long filterSuiteId, String filterSuiteName, int totalExecutions,
			int completedExecutions, int totalTestsRun, int totalPassed, int totalFailed, double overallPassRate,
			long avgSuiteDurationMs, List<TrendPoint> trends, List<FailureHotspot> topFailureHotspots) {
	}

	private final TestExecutionRepository testExecutionRepository;
	private final TestCaseExecutionResultRepository testCaseExecutionResultRepository;
	private final TestSuiteRepository testSuiteRepository;

	public AnalyticsService(TestExecutionRepository testExecutionRepository,
			TestCaseExecutionResultRepository testCaseExecutionResultRepository, TestSuiteRepository testSuiteRepository) {
		this.testExecutionRepository = testExecutionRepository;
		this.testCaseExecutionResultRepository = testCaseExecutionResultRepository;
		this.testSuiteRepository = testSuiteRepository;
	}

	@Transactional(readOnly = true)
	public AnalyticsResponse getTrends(LocalDate fromDate, LocalDate toDate, Integer limit, Long suiteId) {
		LocalDate to = toDate != null ? toDate : LocalDate.now();
		LocalDate from = fromDate != null ? fromDate : to.minusDays(29);
		if (from.isAfter(to)) {
			throw new IllegalArgumentException("from must be before or equal to to");
		}
		int rowLimit = limit != null && limit > 0 ? Math.min(limit, 100) : 10;

		Long filterSuiteId = null;
		String filterSuiteName = null;
		if (suiteId != null) {
			filterSuiteId = suiteId;
			filterSuiteName = testSuiteRepository.findById(suiteId)
					.map(s -> s.getName())
					.orElseThrow(() -> new IllegalArgumentException("TestSuite not found: " + suiteId));
		}

		LocalDateTime fromTs = from.atStartOfDay();
		LocalDateTime toTs = to.plusDays(1).atStartOfDay();

		final Long suiteFilter = suiteId;
		List<TestExecution> inRange = testExecutionRepository.findAll().stream()
				.filter(ex -> ex.getExecutionTime() != null
						&& !ex.getExecutionTime().isBefore(fromTs)
						&& ex.getExecutionTime().isBefore(toTs))
				.filter(ex -> suiteFilter == null
						|| (ex.getTestSuite() != null && suiteFilter.equals(ex.getTestSuite().getId())))
				.toList();

		int totalExecutions = inRange.size();
		List<TestExecution> completed = inRange.stream()
				.filter(ex -> "COMPLETED".equalsIgnoreCase(ex.getStatus()))
				.toList();
		int completedExecutions = completed.size();
		int totalTestsRun = completed.stream().mapToInt(TestExecution::getTotalTests).sum();
		int totalPassed = completed.stream().mapToInt(TestExecution::getPassedTests).sum();
		int totalFailed = completed.stream().mapToInt(TestExecution::getFailedTests).sum();
		double avgSuiteDurationRaw = completed.stream()
				.map(TestExecution::getDurationMs)
				.filter(v -> v != null)
				.mapToLong(Long::longValue)
				.average()
				.orElse(0.0);
		long avgSuiteDurationMs = Math.round(avgSuiteDurationRaw);
		double overallPassRate = totalTestsRun > 0 ? round2((totalPassed * 100.0) / totalTestsRun) : 0.0;

		Map<LocalDate, List<TestExecution>> byDate = completed.stream()
				.collect(Collectors.groupingBy(ex -> ex.getExecutionTime().toLocalDate(), LinkedHashMap::new, Collectors.toList()));
		List<TrendPoint> trends = byDate.entrySet().stream()
				.sorted(Map.Entry.comparingByKey())
				.map(e -> {
					int total = e.getValue().stream().mapToInt(TestExecution::getTotalTests).sum();
					int passed = e.getValue().stream().mapToInt(TestExecution::getPassedTests).sum();
					int failed = e.getValue().stream().mapToInt(TestExecution::getFailedTests).sum();
					double avgDurationRaw = e.getValue().stream()
							.map(TestExecution::getDurationMs)
							.filter(v -> v != null)
							.mapToLong(Long::longValue)
							.average()
							.orElse(0.0);
					long avgDuration = Math.round(avgDurationRaw);
					double passRate = total > 0 ? round2((passed * 100.0) / total) : 0.0;
					return new TrendPoint(e.getKey(), total, passed, failed, passRate, avgDuration);
				})
				.toList();

		List<Long> completedIds = completed.stream().map(TestExecution::getId).toList();
		Map<String, Long> failureCounts = testCaseExecutionResultRepository.findAll().stream()
				.filter(r -> completedIds.contains(r.getTestExecution().getId()))
				.filter(r -> !"PASS".equalsIgnoreCase(r.getStatus()))
				.collect(Collectors.groupingBy(TestCaseExecutionResult::getTestCaseName, Collectors.counting()));
		List<FailureHotspot> hotspots = failureCounts.entrySet().stream()
				.sorted(Map.Entry.<String, Long>comparingByValue().reversed())
				.limit(rowLimit)
				.map(e -> new FailureHotspot(e.getKey(), e.getValue()))
				.toList();

		return new AnalyticsResponse(filterSuiteId, filterSuiteName, totalExecutions, completedExecutions, totalTestsRun,
				totalPassed, totalFailed, overallPassRate, avgSuiteDurationMs, trends, hotspots);
	}

	private double round2(double value) {
		return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
	}
}
