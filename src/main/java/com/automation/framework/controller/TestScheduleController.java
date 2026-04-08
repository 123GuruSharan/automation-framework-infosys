package com.automation.framework.controller;

import com.automation.framework.entity.TestSchedule;
import com.automation.framework.service.TestScheduleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class TestScheduleController {

	private final TestScheduleService testScheduleService;

	public TestScheduleController(TestScheduleService testScheduleService) {
		this.testScheduleService = testScheduleService;
	}

	public record CreateScheduleRequest(String name, Long testSuiteId, String cronExpression) {
	}

	public record ToggleScheduleRequest(Boolean enabled) {
	}

	@PostMapping("/create")
	public ResponseEntity<TestSchedule> create(@RequestBody CreateScheduleRequest request) {
		try {
			TestSchedule schedule = testScheduleService.create(request.name(), request.testSuiteId(), request.cronExpression());
			return ResponseEntity.status(HttpStatus.CREATED).body(schedule);
		} catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
		}
	}

	@GetMapping("/all")
	public List<TestSchedule> getAll() {
		return testScheduleService.getAll();
	}

	@PatchMapping("/{id}/enabled")
	public TestSchedule setEnabled(@PathVariable Long id, @RequestBody ToggleScheduleRequest request) {
		if (request.enabled() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "enabled is required");
		}
		try {
			return testScheduleService.setEnabled(id, request.enabled());
		} catch (IllegalArgumentException e) {
			HttpStatus status = e.getMessage() != null && e.getMessage().startsWith("TestSchedule not found")
					? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
			throw new ResponseStatusException(status, e.getMessage(), e);
		}
	}

	@PostMapping("/{id}/run-now")
	public TestSchedule runNow(@PathVariable Long id) {
		try {
			return testScheduleService.runNow(id);
		} catch (IllegalArgumentException e) {
			HttpStatus status = e.getMessage() != null && e.getMessage().startsWith("TestSchedule not found")
					? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
			throw new ResponseStatusException(status, e.getMessage(), e);
		}
	}
}
