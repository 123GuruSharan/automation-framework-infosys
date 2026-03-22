package com.automation.framework.controller;

import com.automation.framework.entity.TestExecution;
import com.automation.framework.service.TestExecutionService;
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

	public record TestExecutionStartRequest(Long testSuiteId, String status, Integer totalTests, Integer passedTests,
			Integer failedTests) {
	}

	@PostMapping("/start")
	public ResponseEntity<TestExecution> start(@RequestBody TestExecutionStartRequest request) {
		if (request.testSuiteId() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "testSuiteId is required");
		}
		int total = request.totalTests() != null ? request.totalTests() : 0;
		int passed = request.passedTests() != null ? request.passedTests() : 0;
		int failed = request.failedTests() != null ? request.failedTests() : 0;
		TestExecution saved = testExecutionService.start(request.testSuiteId(), request.status(), total, passed,
				failed);
		return ResponseEntity.status(HttpStatus.CREATED).body(saved);
	}

	@GetMapping("/all")
	public List<TestExecution> getAll() {
		return testExecutionService.getAll();
	}

	@GetMapping("/report/{id}")
	public TestExecutionService.ExecutionReportResponse getReport(@PathVariable Long id) {
		return testExecutionService.getExecutionReport(id);
	}
}
