package com.automation.framework.service;

import com.automation.framework.entity.TestExecution;
import com.automation.framework.entity.TestExecutionLog;
import com.automation.framework.repository.TestExecutionLogRepository;
import com.automation.framework.repository.TestExecutionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TestExecutionLogService {

	public record ExecutionLogRow(Long id, String level, String message, String source, LocalDateTime createdAt) {
	}

	private final TestExecutionRepository testExecutionRepository;
	private final TestExecutionLogRepository testExecutionLogRepository;

	public TestExecutionLogService(TestExecutionRepository testExecutionRepository,
			TestExecutionLogRepository testExecutionLogRepository) {
		this.testExecutionRepository = testExecutionRepository;
		this.testExecutionLogRepository = testExecutionLogRepository;
	}

	@Transactional
	public TestExecutionLog addLog(Long executionId, String level, String message, String source) {
		TestExecution execution = testExecutionRepository.findById(executionId)
				.orElseThrow(() -> new IllegalArgumentException("TestExecution not found: " + executionId));
		TestExecutionLog log = new TestExecutionLog();
		log.setTestExecution(execution);
		log.setLevel(normalizeLevel(level));
		log.setMessage(message != null ? message : "");
		log.setSource(source);
		return testExecutionLogRepository.save(log);
	}

	@Transactional(readOnly = true)
	public List<ExecutionLogRow> getLogs(Long executionId) {
		if (!testExecutionRepository.existsById(executionId)) {
			throw new IllegalArgumentException("TestExecution not found: " + executionId);
		}
		return testExecutionLogRepository.findByTestExecution_IdOrderByIdAsc(executionId).stream()
				.map(l -> new ExecutionLogRow(l.getId(), l.getLevel(), l.getMessage(), l.getSource(), l.getCreatedAt()))
				.toList();
	}

	private String normalizeLevel(String level) {
		if (level == null || level.isBlank()) {
			return "INFO";
		}
		String normalized = level.trim().toUpperCase();
		return switch (normalized) {
			case "DEBUG", "INFO", "WARN", "ERROR" -> normalized;
			default -> "INFO";
		};
	}
}
