package com.automation.framework.controller;

import com.automation.framework.entity.TestCase;
import com.automation.framework.service.TestCaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Single test execution API: POST /api/tests/execute/{id}
 */
@RestController
@RequestMapping("/api/tests")
public class TestCaseExecutionController {

	private final TestCaseService testCaseService;

	public TestCaseExecutionController(TestCaseService testCaseService) {
		this.testCaseService = testCaseService;
	}

	@PostMapping("/execute/{id}")
	public ResponseEntity<TestCase> execute(@PathVariable Long id) {
		try {
			TestCase updated = testCaseService.executeTest(id);
			return ResponseEntity.ok(updated);
		} catch (IllegalArgumentException e) {
			String msg = e.getMessage() != null ? e.getMessage() : "Bad request";
			if (msg.startsWith("TestCase not found")) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, msg, e);
			}
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, msg, e);
		}
	}
}
