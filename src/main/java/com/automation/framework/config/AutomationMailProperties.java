package com.automation.framework.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "automation.mail")
public class AutomationMailProperties {

	private boolean enabled = false;

	/** Optional; defaults to server / spring.mail.username when empty */
	private String from = "";

	/** Comma- or semicolon-separated recipients */
	private String to = "";

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getFrom() {
		return from;
	}

	public void setFrom(String from) {
		this.from = from;
	}

	public String getTo() {
		return to;
	}

	public void setTo(String to) {
		this.to = to;
	}
}
