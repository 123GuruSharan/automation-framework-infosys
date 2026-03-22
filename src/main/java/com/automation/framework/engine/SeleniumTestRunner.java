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

	private static final String SAMPLE_URL = "https://example.com";
	private static final String EXPECTED_TITLE = "Example Domain";

	public record UiTestResult(boolean pass, String failureScreenshotPath) {
	}

	private final ScreenshotUtil screenshotUtil;

	public SeleniumTestRunner(ScreenshotUtil screenshotUtil) {
		this.screenshotUtil = screenshotUtil;
	}

	public UiTestResult runSampleUiTest(String testName) {
		WebDriverManager.chromedriver().setup();
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--headless=new");
		options.addArguments("--disable-gpu", "--no-sandbox", "--window-size=1280,800");

		WebDriver driver = null;

		try {
			driver = new ChromeDriver(options);
			log.debug("Navigating to {}", SAMPLE_URL);

			driver.get(SAMPLE_URL);

			// ✅ NORMAL VALIDATION
			String title = driver.getTitle();
			boolean pass = EXPECTED_TITLE.equals(title);

			log.info("Test: {}, Title='{}', Expected='{}', Pass={}",
					testName, title, EXPECTED_TITLE, pass);

			String screenshotPath = null;

			// 📸 Capture screenshot ONLY if failed
			if (!pass) {
				screenshotPath = screenshotUtil.captureFailureScreenshot(driver, testName);
			}

			return new UiTestResult(pass, screenshotPath);

		} catch (Exception e) {
			log.error("Test execution failed: {}", testName, e);

			String screenshotPath = null;

			if (driver != null) {
				screenshotPath = screenshotUtil.captureFailureScreenshot(driver, testName);
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