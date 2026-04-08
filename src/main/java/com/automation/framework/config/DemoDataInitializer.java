package com.automation.framework.config;

import com.automation.framework.service.DemoSeedService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Runs after the application context is up. Enable with {@code automation.demo.seed=true}.
 */
@Component
@Order(100)
@ConditionalOnProperty(name = "automation.demo.seed", havingValue = "true")
public class DemoDataInitializer implements ApplicationRunner {

	private final DemoSeedService demoSeedService;

	public DemoDataInitializer(DemoSeedService demoSeedService) {
		this.demoSeedService = demoSeedService;
	}

	@Override
	public void run(ApplicationArguments args) {
		demoSeedService.seedIfEmpty();
	}
}
