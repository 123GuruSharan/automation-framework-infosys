package com.automation.framework.controller;

import com.automation.framework.service.ResultsService;
import com.automation.framework.service.ResultsService.SuiteResultsResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/results")
public class ResultsController {

	private final ResultsService resultsService;

	public ResultsController(ResultsService resultsService) {
		this.resultsService = resultsService;
	}

	/**
	 * Point-to-point suite results: aggregates executions for one suite (PDF: GET /results/{suiteId}).
	 */
	@GetMapping("/{suiteId}")
	public SuiteResultsResponse bySuite(@PathVariable Long suiteId, @RequestParam(defaultValue = "20") int limit) {
		try {
			return resultsService.getSuiteResults(suiteId, limit);
		} catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
		}
	}
}
