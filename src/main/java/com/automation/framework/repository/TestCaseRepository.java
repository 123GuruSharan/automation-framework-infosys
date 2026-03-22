package com.automation.framework.repository;

import com.automation.framework.entity.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCaseRepository extends JpaRepository<TestCase, Long> {

	List<TestCase> findByTestSuite_Id(Long testSuiteId);
}
