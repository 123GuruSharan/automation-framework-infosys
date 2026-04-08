package com.automation.framework.controller;

import com.automation.framework.service.ReportExportService;
import com.automation.framework.service.ReportExportService.ReportFile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

	private final ReportExportService reportExportService;

	public ReportController(ReportExportService reportExportService) {
		this.reportExportService = reportExportService;
	}

	@GetMapping("/generate")
	public ResponseEntity<byte[]> generate(@RequestParam Long executionId, @RequestParam(defaultValue = "csv") String format) {
		try {
			ReportFile file = reportExportService.generate(executionId, format);
			return ResponseEntity.ok()
					.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.fileName() + "\"")
					.contentType(MediaType.parseMediaType(file.mediaType()))
					.body(file.content());
		} catch (IllegalArgumentException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
		}
	}
}
