package com.automation.framework.repository;

import com.automation.framework.entity.TestCaseExecutionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCaseExecutionResultRepository extends JpaRepository<TestCaseExecutionResult, Long> {

	List<TestCaseExecutionResult> findByTestExecution_IdOrderByIdAsc(Long testExecutionId);
}
