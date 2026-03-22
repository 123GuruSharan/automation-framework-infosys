package com.automation.framework.repository;

import com.automation.framework.entity.TestSuite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestSuiteRepository extends JpaRepository<TestSuite, Long> {
}
