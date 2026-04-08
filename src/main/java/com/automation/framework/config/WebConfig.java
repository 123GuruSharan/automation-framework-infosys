package com.automation.framework.config;

import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Value("${automation.screenshots.dir:screenshots}")
	private String screenshotsDir;

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		String location = Paths.get(screenshotsDir).toAbsolutePath().normalize().toUri().toString();
		registry.addResourceHandler("/screenshots/**").addResourceLocations(location);
	}
}
