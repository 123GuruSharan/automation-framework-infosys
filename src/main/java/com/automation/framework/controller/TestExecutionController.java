package com.automation.framework.controller;

import com.automation.framework.entity.TestExecution;
import com.automation.framework.service.TestExecutionService;
import com.automation.framework.service.TestExecutionService.ExecutionReportResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/executions")
public class TestExecutionController {

	private final TestExecutionService testExecutionService;

	public TestExecutionController(TestExecutionService testExecutionService) {
		this.testExecutionService = testExecutionService;
	}

	public record StartExecutionRequest(Long testSuiteId, String status, Integer totalTests, Integer passedTests,
			Integer failedTests) {
	}

	@PostMapping("/start")
	public ResponseEntity<TestExecution> start(@RequestBody StartExecutionRequest request) {
		if (request.testSuiteId() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "testSuiteId is required");
		}
		TestExecution ex = testExecutionService.start(
				request.testSuiteId(),
				request.status(),
				request.totalTests() != null ? request.totalTests() : 0,
				request.passedTests() != null ? request.passedTests() : 0,
				request.failedTests() != null ? request.failedTests() : 0);
		return ResponseEntity.status(HttpStatus.CREATED).body(ex);
	}

	@GetMapping("/all")
	public List<TestExecution> getAll() {
		return testExecutionService.getAll();
	}

	@GetMapping("/report/{id}")
	public ExecutionReportResponse getReport(@PathVariable Long id) {
		return testExecutionService.getExecutionReport(id);
	}
}
