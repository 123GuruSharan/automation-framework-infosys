package com.automation.framework.controller;

import com.automation.framework.entity.TestCase;
import com.automation.framework.service.TestCaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/testcases")
public class TestCaseController {

	private final TestCaseService testCaseService;

	public TestCaseController(TestCaseService testCaseService) {
		this.testCaseService = testCaseService;
	}

	public record TestCaseCreateRequest(String name, String description, String type, String status,
			Long testSuiteId, String url, String expectedTitle) {
	}

	public record TestCaseUpdateRequest(String name, String description, String type, String status,
			Long testSuiteId, String url, String expectedTitle) {
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
		entity.setUrl(request.url());
		entity.setExpectedTitle(request.expectedTitle());
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

	@PatchMapping("/{id}")
	public TestCase update(@PathVariable Long id, @RequestBody TestCaseUpdateRequest request) {
		try {
			return testCaseService.update(id, request.name(), request.description(), request.type(), request.status(),
					request.testSuiteId(), request.url(), request.expectedTitle());
		} catch (IllegalArgumentException e) {
			HttpStatus status = e.getMessage() != null && e.getMessage().startsWith("TestCase not found")
					? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
			throw new ResponseStatusException(status, e.getMessage(), e);
		}
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
