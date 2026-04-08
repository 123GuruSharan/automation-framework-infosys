package com.automation.framework.service;

import com.automation.framework.entity.TestCase;
import com.automation.framework.entity.TestSuite;
import com.automation.framework.repository.TestSuiteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds a minimal suite + API test cases when the DB is empty and {@code automation.demo.seed=true}.
 * API tests use {@link com.automation.framework.engine.ApiTestRunner} (no browser, needs outbound HTTPS).
 */
@Service
public class DemoSeedService {

	private static final Logger log = LoggerFactory.getLogger(DemoSeedService.class);

	public static final String DEMO_SUITE_NAME = "E2E Demo Suite";

	private final TestSuiteRepository testSuiteRepository;
	private final TestSuiteService testSuiteService;
	private final TestCaseService testCaseService;

	public DemoSeedService(TestSuiteRepository testSuiteRepository, TestSuiteService testSuiteService,
			TestCaseService testCaseService) {
		this.testSuiteRepository = testSuiteRepository;
		this.testSuiteService = testSuiteService;
		this.testCaseService = testCaseService;
	}

	@Transactional
	public void seedIfEmpty() {
		if (testSuiteRepository.count() > 0) {
			log.info("Demo seed skipped: database already has {} suite(s)", testSuiteRepository.count());
			return;
		}
		TestSuite suite = new TestSuite();
		suite.setName(DEMO_SUITE_NAME);
		suite.setDescription("Seeded for end-to-end demo. Contains API-only tests (no Selenium).");
		TestSuite saved = testSuiteService.create(suite);
		log.info("Demo seed: created suite id={} name={}", saved.getId(), saved.getName());

		TestCase api1 = new TestCase();
		api1.setName("REST sample GET — jsonplaceholder");
		api1.setDescription("REST-Assured GET; expects HTTP 200.");
		api1.setType("API");
		api1.setStatus("PENDING");
		testCaseService.create(api1, saved.getId());

		TestCase api2 = new TestCase();
		api2.setName("REST sample GET — parallel slot");
		api2.setDescription("Second API case to exercise the parallel pool.");
		api2.setType("API");
		api2.setStatus("PENDING");
		testCaseService.create(api2, saved.getId());

		log.info("Demo seed: created 2 API test case(s) under suite id={}", saved.getId());
	}
}
