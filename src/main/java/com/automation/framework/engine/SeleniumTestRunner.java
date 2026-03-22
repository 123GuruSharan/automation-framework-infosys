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

	public boolean runSampleUiTest() {
		WebDriverManager.chromedriver().setup();
		ChromeOptions options = new ChromeOptions();
		options.addArguments("--headless=new");
		options.addArguments("--disable-gpu", "--no-sandbox", "--window-size=1280,800");

		WebDriver driver = null;
		try {
			driver = new ChromeDriver(options);
			log.debug("Navigating to {}", SAMPLE_URL);
			driver.get(SAMPLE_URL);
			String title = driver.getTitle();
			boolean pass = EXPECTED_TITLE.equals(title);
			log.info("Selenium UI sample: url={}, title='{}', expected='{}', pass={}", SAMPLE_URL, title,
					EXPECTED_TITLE, pass);
			return pass;
		} catch (Exception e) {
			log.error("Selenium UI sample test failed", e);
			return false;
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
