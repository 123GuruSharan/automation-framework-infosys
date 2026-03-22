package com.automation.framework.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "test_case_execution_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "testExecution")
@ToString(exclude = "testExecution")
public class TestCaseExecutionResult {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "test_execution_id", nullable = false)
	private TestExecution testExecution;

	@Column(nullable = false)
	private Long testCaseId;

	@Column(nullable = false, length = 500)
	private String testCaseName;

	@Column(nullable = false, length = 20)
	private String status;

	@Column(nullable = false)
	private LocalDateTime startedAt;

	@Column(nullable = false)
	private LocalDateTime endedAt;

	@Column(nullable = false)
	private long durationMs;

	@Column(length = 2000)
	private String screenshotPath;
}
