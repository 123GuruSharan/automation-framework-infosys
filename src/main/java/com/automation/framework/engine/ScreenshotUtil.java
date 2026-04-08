package com.automation.framework.engine;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class ScreenshotUtil {

	private static final Logger log = LoggerFactory.getLogger(ScreenshotUtil.class);

	private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss_SSS");

	@Value("${automation.screenshots.dir:screenshots}")
	private String screenshotsDir;

	public String captureFailureScreenshot(WebDriver driver, String testName) {
		if (driver == null) {
			return null;
		}
		try {
			String safe = sanitizeFileName(testName);
			String timestamp = TS.format(LocalDateTime.now());
			Path dir = Paths.get(screenshotsDir).toAbsolutePath().normalize();
			Files.createDirectories(dir);
			Path file = dir.resolve(safe + "_" + timestamp + ".png");
			byte[] png = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
			Files.write(file, png);
			log.info("Screenshot saved: {}", file);
			return file.toString();
		} catch (Exception e) {
			log.error("Failed to capture screenshot for test={}", testName, e);
			return null;
		}
	}

	/**
	 * Saves a failure screenshot with the test case id in the filename (e.g. {@code testcase_12_20260323_153045_123.png}).
	 */
	public String captureFailureScreenshot(WebDriver driver, Long testCaseId) {
		if (driver == null || testCaseId == null) {
			return null;
		}
		try {
			String timestamp = TS.format(LocalDateTime.now());
			Path dir = Paths.get(screenshotsDir).toAbsolutePath().normalize();
			Files.createDirectories(dir);
			Path file = dir.resolve("testcase_" + testCaseId + "_" + timestamp + ".png");
			byte[] png = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
			Files.write(file, png);
			log.info("Screenshot saved: {}", file);
			return file.toString();
		} catch (Exception e) {
			log.error("Failed to capture screenshot for testCaseId={}", testCaseId, e);
			return null;
		}
	}

	private static String sanitizeFileName(String testName) {
		if (testName == null || testName.isBlank()) {
			return "test";
		}
		String s = testName.trim().replaceAll("[^a-zA-Z0-9._-]+", "_");
		return s.isEmpty() ? "test" : s;
	}
}
