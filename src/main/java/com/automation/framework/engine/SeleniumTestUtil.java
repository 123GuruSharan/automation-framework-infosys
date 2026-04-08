package com.automation.framework.engine;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Runs a single UI check: open URL, compare {@link org.openqa.selenium.WebDriver#getTitle()} to expected data.
 * On assertion failure or unexpected error, captures one screenshot (only then) via {@link TakesScreenshot}.
 */
@Component
public class SeleniumTestUtil {

	private static final Logger log = LoggerFactory.getLogger(SeleniumTestUtil.class);

	/**
	 * @param actualTitle  page title after navigation (null if navigation/assertion did not complete)
	 * @param failureScreenshotPath filesystem path to PNG if a screenshot was taken; otherwise null
	 */
	public record UiTestRunResult(boolean pass, String expectedTitle, String actualTitle, String failureScreenshotPath) {
	}

	private final ScreenshotUtil screenshotUtil;

	public SeleniumTestUtil(ScreenshotUtil screenshotUtil) {
		this.screenshotUtil = screenshotUtil;
	}

	/**
	 * Executes the test using data from your test case: compares {@code expectedTitle} to the real page title.
	 * Pass → no file written. Fail → PNG under configured {@code automation.screenshots.dir} with id in the name.
	 */
	public UiTestRunResult runTest(Long testCaseId, String url, String expectedTitle) {
		if (testCaseId == null) {
			log.warn("runTest requires testCaseId");
			return new UiTestRunResult(false, expectedTitle, null, null);
		}
		if (url == null || url.isBlank() || expectedTitle == null || expectedTitle.isBlank()) {
			log.warn("runTest requires non-blank url and expectedTitle");
			return new UiTestRunResult(false, expectedTitle, null, null);
		}

		String expected = expectedTitle.trim();

		WebDriverManager.chromedriver().setup();
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--headless=new");
		options.addArguments("--disable-gpu", "--no-sandbox", "--window-size=1280,800");

		WebDriver driver = null;
		try {
			driver = new ChromeDriver(options);
			log.debug("Navigating to {}", url);
			driver.get(url.trim());

			String actual = driver.getTitle();
			String actualNorm = actual != null ? actual.trim() : "";
			boolean pass = expected.equals(actualNorm);

			log.info("Title assertion: testCaseId={} expected='{}' actual='{}' pass={}", testCaseId, expected,
					actual, pass);

			String screenshotPath = null;
			if (!pass) {
				screenshotPath = screenshotUtil.captureFailureScreenshot(driver, testCaseId);
			}

			return new UiTestRunResult(pass, expected, actualNorm, screenshotPath);

		} catch (Exception e) {
			log.error("Selenium runTest failed for testCaseId={} url={}", testCaseId, url, e);
			String screenshotPath = null;
			if (driver != null) {
				screenshotPath = screenshotUtil.captureFailureScreenshot(driver, testCaseId);
			}
			return new UiTestRunResult(false, expected, null, screenshotPath);
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
