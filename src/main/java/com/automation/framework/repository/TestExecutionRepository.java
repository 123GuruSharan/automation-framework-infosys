package com.automation.framework.repository;

import com.automation.framework.entity.TestExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestExecutionRepository extends JpaRepository<TestExecution, Long> {

	List<TestExecution> findByTestSuite_IdOrderByExecutionTimeDesc(Long testSuiteId);
}
