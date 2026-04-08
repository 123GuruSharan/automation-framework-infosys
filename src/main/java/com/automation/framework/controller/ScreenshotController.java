package com.automation.framework.controller;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/screenshots", "/api/screenshots" })
public class ScreenshotController {

	@Value("${automation.screenshots.dir:screenshots}")
	private String screenshotsDir;

	@GetMapping("/{requested:.+}")
	public ResponseEntity<Resource> getScreenshot(@PathVariable String requested) {
		try {
			// Accept either a raw file name or an encoded full path; always serve by basename.
			String normalized = requested.replace('\\', '/');
			String fileName = normalized.substring(normalized.lastIndexOf('/') + 1);
			if (fileName.isBlank()) {
				return ResponseEntity.notFound().build();
			}

			Path dir = Paths.get(screenshotsDir).toAbsolutePath().normalize();
			Path file = dir.resolve(fileName).normalize();
			if (!file.startsWith(dir) || !Files.exists(file) || !Files.isRegularFile(file)) {
				return ResponseEntity.notFound().build();
			}

			Resource resource = new UrlResource(file.toUri());
			String contentType = Files.probeContentType(file);
			MediaType mediaType = contentType != null ? MediaType.parseMediaType(contentType) : MediaType.IMAGE_PNG;
			return ResponseEntity.ok()
					.contentType(mediaType)
					.header(HttpHeaders.CACHE_CONTROL, "no-store")
					.body(resource);
		} catch (Exception e) {
			return ResponseEntity.notFound().build();
		}
	}

	@GetMapping(params = "name")
	public ResponseEntity<Resource> getScreenshotByName(@RequestParam String name) {
		return serveByBaseName(name);
	}

	@GetMapping(params = "path")
	public ResponseEntity<Resource> getScreenshotByPath(@RequestParam String path) {
		return serveByBaseName(path);
	}

	private ResponseEntity<Resource> serveByBaseName(String input) {
		try {
			String normalized = (input == null ? "" : input).replace('\\', '/');
			String fileName = normalized.substring(normalized.lastIndexOf('/') + 1);
			if (fileName.isBlank()) {
				return ResponseEntity.notFound().build();
			}

			Path dir = Paths.get(screenshotsDir).toAbsolutePath().normalize();
			Path file = dir.resolve(fileName).normalize();
			if (!file.startsWith(dir) || !Files.exists(file) || !Files.isRegularFile(file)) {
				return ResponseEntity.notFound().build();
			}

			Resource resource = new UrlResource(file.toUri());
			String contentType = Files.probeContentType(file);
			MediaType mediaType = contentType != null ? MediaType.parseMediaType(contentType) : MediaType.IMAGE_PNG;
			return ResponseEntity.ok()
					.contentType(mediaType)
					.header(HttpHeaders.CACHE_CONTROL, "no-store")
					.body(resource);
		} catch (Exception e) {
			return ResponseEntity.notFound().build();
		}
	}
}
