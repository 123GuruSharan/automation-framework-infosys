package com.automation.framework.repository;

import com.automation.framework.entity.TestExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestExecutionLogRepository extends JpaRepository<TestExecutionLog, Long> {
	List<TestExecutionLog> findByTestExecution_IdOrderByIdAsc(Long testExecutionId);
}
