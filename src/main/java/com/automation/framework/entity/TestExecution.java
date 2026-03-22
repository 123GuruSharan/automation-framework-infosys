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
@Table(name = "test_executions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "testSuite")
@ToString(exclude = "testSuite")
public class TestExecution {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private LocalDateTime executionTime;

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
}
