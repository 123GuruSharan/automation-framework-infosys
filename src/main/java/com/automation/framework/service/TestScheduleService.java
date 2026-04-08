package com.automation.framework.service;

import com.automation.framework.entity.TestSchedule;
import com.automation.framework.entity.TestSuite;
import com.automation.framework.repository.TestScheduleRepository;
import com.automation.framework.repository.TestSuiteRepository;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TestScheduleService {

	private final TestScheduleRepository testScheduleRepository;
	private final TestSuiteRepository testSuiteRepository;
	private final TestExecutionService testExecutionService;

	public TestScheduleService(TestScheduleRepository testScheduleRepository, TestSuiteRepository testSuiteRepository,
			TestExecutionService testExecutionService) {
		this.testScheduleRepository = testScheduleRepository;
		this.testSuiteRepository = testSuiteRepository;
		this.testExecutionService = testExecutionService;
	}

	@Transactional
	public TestSchedule create(String name, Long testSuiteId, String cronExpression) {
		if (testSuiteId == null) {
			throw new IllegalArgumentException("testSuiteId is required");
		}
		String cron = normalizeAndValidateCron(cronExpression);
		TestSuite suite = testSuiteRepository.findById(testSuiteId)
				.orElseThrow(() -> new IllegalArgumentException("TestSuite not found: " + testSuiteId));

		TestSchedule schedule = new TestSchedule();
		schedule.setName(name != null && !name.isBlank() ? name.trim() : "Suite #" + testSuiteId + " schedule");
		schedule.setCronExpression(cron);
		schedule.setEnabled(true);
		schedule.setTestSuite(suite);
		return testScheduleRepository.save(schedule);
	}

	@Transactional(readOnly = true)
	public List<TestSchedule> getAll() {
		List<TestSchedule> schedules = testScheduleRepository.findAll();
		for (TestSchedule schedule : schedules) {
			schedule.setNextRunAt(computeNextRunAt(schedule));
		}
		return schedules;
	}

	@Transactional
	public TestSchedule setEnabled(Long id, boolean enabled) {
		TestSchedule schedule = testScheduleRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("TestSchedule not found: " + id));
		schedule.setEnabled(enabled);
		return testScheduleRepository.save(schedule);
	}

	@Transactional
	public TestSchedule runNow(Long id) {
		TestSchedule schedule = testScheduleRepository.findById(id)
				.orElseThrow(() -> new IllegalArgumentException("TestSchedule not found: " + id));
		testExecutionService.start(schedule.getTestSuite().getId(), "SCHEDULED", 0, 0, 0);
		schedule.setLastRunAt(LocalDateTime.now());
		return testScheduleRepository.save(schedule);
	}

	@Transactional(readOnly = true)
	public List<TestSchedule> getEnabledSchedules() {
		return testScheduleRepository.findByEnabledTrueOrderByIdAsc();
	}

	@Transactional
	public void markExecuted(Long scheduleId, LocalDateTime when) {
		TestSchedule schedule = testScheduleRepository.findById(scheduleId)
				.orElseThrow(() -> new IllegalArgumentException("TestSchedule not found: " + scheduleId));
		schedule.setLastRunAt(when != null ? when : LocalDateTime.now());
		testScheduleRepository.save(schedule);
	}

	@Transactional(readOnly = true)
	public boolean isDue(TestSchedule schedule, LocalDateTime now) {
		if (schedule == null || !schedule.isEnabled()) {
			return false;
		}
		CronExpression cron = CronExpression.parse(schedule.getCronExpression());
		LocalDateTime base = schedule.getLastRunAt() != null ? schedule.getLastRunAt() : schedule.getCreatedAt();
		LocalDateTime next = cron.next(base);
		return next != null && !next.isAfter(now);
	}

	@Transactional(readOnly = true)
	public LocalDateTime computeNextRunAt(TestSchedule schedule) {
		if (schedule == null || !schedule.isEnabled()) {
			return null;
		}
		CronExpression cron = CronExpression.parse(schedule.getCronExpression());
		LocalDateTime base = schedule.getLastRunAt() != null ? schedule.getLastRunAt() : schedule.getCreatedAt();
		return cron.next(base);
	}

	private String normalizeAndValidateCron(String value) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException("cronExpression is required");
		}
		String cron = value.trim();
		CronExpression.parse(cron);
		return cron;
	}
}
