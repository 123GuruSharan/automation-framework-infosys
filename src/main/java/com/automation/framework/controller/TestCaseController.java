package com.automation.framework.controller;

import com.automation.framework.entity.TestCase;
import com.automation.framework.service.TestCaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/testcases")
public class TestCaseController {

	private final TestCaseService testCaseService;

	public TestCaseController(TestCaseService testCaseService) {
		this.testCaseService = testCaseService;
	}

	public record TestCaseCreateRequest(String name, String description, String type, String status,
			Long testSuiteId) {
	}

	@PostMapping("/create")
	public ResponseEntity<TestCase> create(@RequestBody TestCaseCreateRequest request) {
		if (request.testSuiteId() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "testSuiteId is required");
		}
		TestCase entity = new TestCase();
		entity.setName(request.name());
		entity.setDescription(request.description());
		entity.setType(request.type() != null ? request.type() : "UI");
		entity.setStatus(request.status() != null ? request.status() : "PENDING");
		TestCase saved = testCaseService.create(entity, request.testSuiteId());
		return ResponseEntity.status(HttpStatus.CREATED).body(saved);
	}

	@GetMapping("/all")
	public List<TestCase> getAll() {
		return testCaseService.getAll();
	}

	@GetMapping("/{id}")
	public TestCase getById(@PathVariable Long id) {
		return testCaseService.getById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TestCase not found"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		if (testCaseService.getById(id).isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "TestCase not found");
		}
		testCaseService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
