package com.automation.framework.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {

	@GetMapping(produces = MediaType.TEXT_PLAIN_VALUE)
	public String health() {
		return "Framework is running";
	}
}
