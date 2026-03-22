package com.automation.framework.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_executions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = { "testSuite", "caseResults" })
@ToString(exclude = { "testSuite", "caseResults" })
public class TestExecution {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/** When this execution record was created / run started */
	@Column(nullable = false)
	private LocalDateTime executionTime;

	/** Wall-clock duration for the full suite run (milliseconds) */
	@Column
	private Long durationMs;

	@Column(nullable = false)
	private String status;

	@Column(nullable = false)
	private int totalTests;

	@Column(nullable = false)
	private int passedTests;

	@Column(nullable = false)
	private int failedTests;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "test_suite_id", nullable = false)
	private TestSuite testSuite;

	@JsonIgnore
	@OneToMany(mappedBy = "testExecution", cascade = CascadeType.ALL, orphanRemoval = true)
	private List<TestCaseExecutionResult> caseResults = new ArrayList<>();
}
