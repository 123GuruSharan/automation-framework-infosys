package com.automation.framework.service;

import com.automation.framework.engine.SeleniumTestUtil;
import com.automation.framework.entity.TestCase;
import com.automation.framework.entity.TestSuite;
import com.automation.framework.repository.TestCaseRepository;
import com.automation.framework.repository.TestSuiteRepository;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TestCaseServiceTest {

	@Test
	void update_updatesEditableFieldsAndSuite() {
		TestCaseRepository testCaseRepository = mock(TestCaseRepository.class);
		TestSuiteRepository testSuiteRepository = mock(TestSuiteRepository.class);
		SeleniumTestUtil seleniumTestUtil = mock(SeleniumTestUtil.class);
		TestCaseService service = new TestCaseService(testCaseRepository, testSuiteRepository, seleniumTestUtil);

		TestSuite sourceSuite = new TestSuite();
		sourceSuite.setId(10L);
		sourceSuite.setTestCases(new ArrayList<>());

		TestSuite targetSuite = new TestSuite();
		targetSuite.setId(20L);
		targetSuite.setTestCases(new ArrayList<>());

		TestCase tc = new TestCase();
		tc.setId(1L);
		tc.setName("Old name");
		tc.setExpectedTitle("OldTitle");
		tc.setTestSuite(sourceSuite);
		sourceSuite.getTestCases().add(tc);

		when(testCaseRepository.findById(1L)).thenReturn(Optional.of(tc));
		when(testSuiteRepository.findById(20L)).thenReturn(Optional.of(targetSuite));
		when(testCaseRepository.save(tc)).thenReturn(tc);

		TestCase updated = service.update(1L, "New name", "Updated", "UI", "PENDING", 20L, "https://example.com",
				"WrongValue");

		assertSame(tc, updated);
		assertEquals("New name", tc.getName());
		assertEquals("WrongValue", tc.getExpectedTitle());
		assertEquals("https://example.com", tc.getUrl());
		assertEquals(20L, tc.getTestSuite().getId());
		verify(testCaseRepository).save(tc);
	}
}
