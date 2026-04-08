package com.automation.framework.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "test_cases")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "testSuite")
@ToString(exclude = "testSuite")
public class TestCase {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Column(length = 2000)
	private String description;

	@Column(nullable = false, length = 10)
	private String type;

	@Column(nullable = false, length = 20)
	private String status;

	/** Target page for UI tests (e.g. https://example.com). Optional for non-UI tests. */
	@Column(length = 2000)
	private String url;

	/** Expected document title for UI tests. Optional for non-UI tests. */
	@Column(length = 500)
	private String expectedTitle;

	@Column(nullable = false)
	private LocalDateTime createdAt;

	@JsonBackReference
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "test_suite_id", nullable = false)
	private TestSuite testSuite;

	@JsonProperty("testSuiteId")
	public Long getTestSuiteId() {
		return testSuite != null ? testSuite.getId() : null;
	}

	@JsonProperty("testSuiteName")
	public String getTestSuiteName() {
		return testSuite != null ? testSuite.getName() : null;
	}

	@PrePersist
	protected void onCreate() {
		if (createdAt == null) {
			createdAt = LocalDateTime.now();
		}
	}
}
