package com.automation.framework.controller;

import com.automation.framework.entity.TestSuite;
import com.automation.framework.service.TestSuiteService;
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
@RequestMapping("/api/testsuites")
public class TestSuiteController {

	private final TestSuiteService testSuiteService;

	public TestSuiteController(TestSuiteService testSuiteService) {
		this.testSuiteService = testSuiteService;
	}

	public record TestSuiteCreateRequest(String name, String description) {
	}

	@PostMapping("/create")
	public ResponseEntity<TestSuite> create(@RequestBody TestSuiteCreateRequest request) {
		TestSuite suite = new TestSuite();
		suite.setName(request.name());
		suite.setDescription(request.description());
		TestSuite saved = testSuiteService.create(suite);
		return ResponseEntity.status(HttpStatus.CREATED).body(saved);
	}

	@GetMapping("/all")
	public List<TestSuite> getAll() {
		return testSuiteService.getAll();
	}

	@GetMapping("/{id}")
	public TestSuite getById(@PathVariable Long id) {
		return testSuiteService.getById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TestSuite not found"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		if (testSuiteService.getById(id).isEmpty()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "TestSuite not found");
		}
		testSuiteService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
