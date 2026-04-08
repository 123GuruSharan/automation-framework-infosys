package com.automation.framework.engine;

import com.automation.framework.entity.TestSchedule;
import com.automation.framework.service.TestExecutionService;
import com.automation.framework.service.TestScheduleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class TestScheduleRunner {

	private static final Logger log = LoggerFactory.getLogger(TestScheduleRunner.class);
	private final AtomicBoolean running = new AtomicBoolean(false);

	private final TestScheduleService testScheduleService;
	private final TestExecutionService testExecutionService;

	public TestScheduleRunner(TestScheduleService testScheduleService, TestExecutionService testExecutionService) {
		this.testScheduleService = testScheduleService;
		this.testExecutionService = testExecutionService;
	}

	@Scheduled(fixedDelayString = "${automation.scheduler.poll-ms:30000}")
	public void runDueSchedules() {
		if (!running.compareAndSet(false, true)) {
			return;
		}
		try {
			LocalDateTime now = LocalDateTime.now();
			List<TestSchedule> schedules = testScheduleService.getEnabledSchedules();
			for (TestSchedule schedule : schedules) {
				try {
					if (!testScheduleService.isDue(schedule, now)) {
						continue;
					}
					Long suiteId = schedule.getTestSuite().getId();
					log.info("Scheduler running scheduleId={} suiteId={} cron={}",
							schedule.getId(), suiteId, schedule.getCronExpression());
					// Same path as POST /api/executions/start — persistence, logs, optional failure email
					testExecutionService.start(suiteId, "SCHEDULED", 0, 0, 0);
					testScheduleService.markExecuted(schedule.getId(), now);
				} catch (Exception ex) {
					log.error("Scheduled execution failed for scheduleId={}", schedule.getId(), ex);
				}
			}
		} finally {
			running.set(false);
		}
	}
}
