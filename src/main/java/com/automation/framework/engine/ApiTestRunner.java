package com.automation.framework.engine;

import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ApiTestRunner {

	private static final Logger log = LoggerFactory.getLogger(ApiTestRunner.class);

	private static final String SAMPLE_GET_URL = "https://jsonplaceholder.typicode.com/posts/1";

	public boolean runSampleApiTest() {
		try {
			Response response = RestAssured.given().when().get(SAMPLE_GET_URL);
			int status = response.getStatusCode();
			boolean pass = status == 200;
			log.info("REST sample GET: url={}, status={}, pass={}", SAMPLE_GET_URL, status, pass);
			return pass;
		} catch (Exception e) {
			log.error("REST sample API test failed", e);
			return false;
		}
	}
}
