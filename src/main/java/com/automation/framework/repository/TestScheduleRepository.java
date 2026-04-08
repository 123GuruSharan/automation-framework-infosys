package com.automation.framework.repository;

import com.automation.framework.entity.TestSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestScheduleRepository extends JpaRepository<TestSchedule, Long> {
	List<TestSchedule> findByEnabledTrueOrderByIdAsc();
}
