package com.automation.framework.service;

import com.automation.framework.config.AutomationMailProperties;
import com.automation.framework.entity.TestExecution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ExecutionNotificationService {

	private static final Logger log = LoggerFactory.getLogger(ExecutionNotificationService.class);

	private final AutomationMailProperties props;
	private final ObjectProvider<JavaMailSender> mailSenderProvider;

	public ExecutionNotificationService(AutomationMailProperties props,
			ObjectProvider<JavaMailSender> mailSenderProvider) {
		this.props = props;
		this.mailSenderProvider = mailSenderProvider;
	}

	/**
	 * Sends a point-to-point email alert when a suite run has failures or ends in ERROR (if mail is configured).
	 */
	public void notifyIfExecutionProblem(TestExecution ex) {
		if (!props.isEnabled()) {
			return;
		}
		JavaMailSender sender = mailSenderProvider.getIfAvailable();
		if (sender == null) {
			log.debug("Skipping mail: no JavaMailSender (set spring.mail.host and credentials).");
			return;
		}
		String to = props.getTo();
		if (to == null || to.isBlank()) {
			return;
		}
		if (ex.getFailedTests() <= 0 && !"ERROR".equalsIgnoreCase(ex.getStatus())) {
			return;
		}
		try {
			SimpleMailMessage msg = new SimpleMailMessage();
			String from = props.getFrom();
			if (from != null && !from.isBlank()) {
				msg.setFrom(from.trim());
			}
			msg.setTo(to.split("[,;]\\s*"));
			msg.setSubject(String.format("[Automation] Suite run issue — execution #%d", ex.getId()));
			msg.setText(buildBody(ex));
			sender.send(msg);
		} catch (Exception e) {
			log.warn("Failed to send execution alert: {}", e.getMessage());
		}
	}

	private String buildBody(TestExecution ex) {
		String suite = ex.getTestSuite() != null ? ex.getTestSuite().getName() : "(unknown suite)";
		return String.join("\n",
				"Test execution notification",
				"",
				"Execution id: " + ex.getId(),
				"Suite: " + suite,
				"Status: " + ex.getStatus(),
				"Total tests: " + ex.getTotalTests(),
				"Passed: " + ex.getPassedTests(),
				"Failed: " + ex.getFailedTests(),
				"Duration (ms): " + (ex.getDurationMs() != null ? ex.getDurationMs() : "—"),
				"",
				"Open the dashboard Execution page or GET /api/executions/report/" + ex.getId() + " for details.");
	}
}
