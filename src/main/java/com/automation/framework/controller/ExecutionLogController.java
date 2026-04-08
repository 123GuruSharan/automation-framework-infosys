package com.automation.framework.controller;

import com.automation.framework.service.TestExecutionLogService;
import com.automation.framework.service.TestExecutionLogService.ExecutionLogRow;
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
@RequestMapping("/api/logs")
public class ExecutionLogController {

	private final TestExecutionLogService testExecutionLogService;

	public ExecutionLogController(TestExecutionLogService testExecutionLogService) {
		this.testExecutionLogService = testExecutionLogService;
	}

	public record CollectLogRequest(Long executionId, String level, String message, String source) {
	}

	@PostMapping("/collect")
	public ResponseEntity<?> collect(@RequestBody CollectLogRequest request) {
		if (request.executionId() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "executionId is required");
		}
		if (request.message() == null || request.message().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "message is required");
		}
		try {
			var saved = testExecutionLogService.addLog(request.executionId(), request.level(), request.message(), request.source());
			return ResponseEntity.status(HttpStatus.CREATED).body(saved);
		} catch (IllegalArgumentException e) {
			HttpStatus status = e.getMessage() != null && e.getMessage().startsWith("TestExecution not found")
					? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
			throw new ResponseStatusException(status, e.getMessage(), e);
		}
	}

	@GetMapping("/{executionId}")
	public List<ExecutionLogRow> getByExecution(@PathVariable Long executionId) {
		try {
			return testExecutionLogService.getLogs(executionId);
		} catch (IllegalArgumentException e) {
			HttpStatus status = e.getMessage() != null && e.getMessage().startsWith("TestExecution not found")
					? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
			throw new ResponseStatusException(status, e.getMessage(), e);
		}
	}
}
