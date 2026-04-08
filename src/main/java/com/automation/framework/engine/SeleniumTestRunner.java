package com.automation.framework.engine;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SeleniumTestRunner {

	private static final Logger log = LoggerFactory.getLogger(SeleniumTestRunner.class);

	/** Used when a suite case has no URL/title in DB (backward compatible). */
	private static final String DEFAULT_URL = "https://example.com";
	private static final String DEFAULT_EXPECTED_TITLE = "Example Domain";

	public record UiTestResult(boolean pass, String failureScreenshotPath) {
	}

	private final ScreenshotUtil screenshotUtil;

	public SeleniumTestRunner(ScreenshotUtil screenshotUtil) {
		this.screenshotUtil = screenshotUtil;
	}

	/**
	 * Runs a UI check using DB fields when present; otherwise example.com / Example Domain.
	 * Pass/fail comes only from comparing expected vs actual title; screenshots are taken only on failure.
	 */
	public UiTestResult runUiTest(Long testCaseId, String testName, String url, String expectedTitle) {
		String targetUrl = (url != null && !url.isBlank()) ? url.trim() : DEFAULT_URL;
		String expected = (expectedTitle != null && !expectedTitle.isBlank()) ? expectedTitle.trim()
				: DEFAULT_EXPECTED_TITLE;

		WebDriverManager.chromedriver().setup();
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--headless=new");
		options.addArguments("--disable-gpu", "--no-sandbox", "--window-size=1280,800");

		WebDriver driver = null;

		try {
			driver = new ChromeDriver(options);
			log.debug("Navigating to {}", targetUrl);

			driver.get(targetUrl);

			String title = driver.getTitle();
			boolean pass = expected.equals(title != null ? title.trim() : "");

			log.info("Test: {}, Title='{}', Expected='{}', Pass={}", testName, title, expected, pass);

			String screenshotPath = null;

			if (!pass) {
				screenshotPath = testCaseId != null
						? screenshotUtil.captureFailureScreenshot(driver, testCaseId)
						: screenshotUtil.captureFailureScreenshot(driver, testName);
			}

			return new UiTestResult(pass, screenshotPath);

		} catch (Exception e) {
			log.error("Test execution failed: {}", testName, e);

			String screenshotPath = null;

			if (driver != null) {
				screenshotPath = testCaseId != null
						? screenshotUtil.captureFailureScreenshot(driver, testCaseId)
						: screenshotUtil.captureFailureScreenshot(driver, testName);
			}

			return new UiTestResult(false, screenshotPath);

		} finally {
			if (driver != null) {
				try {
					driver.quit();
				} catch (Exception e) {
					log.warn("Error closing WebDriver", e);
				}
			}
		}
	}
}