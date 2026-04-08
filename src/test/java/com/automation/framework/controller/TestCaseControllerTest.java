package com.automation.framework.controller;

import com.automation.framework.entity.TestCase;
import com.automation.framework.entity.TestSuite;
import com.automation.framework.service.TestCaseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TestCaseControllerTest {

	private TestCaseService testCaseService;
	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		testCaseService = mock(TestCaseService.class);
		TestCaseController controller = new TestCaseController(testCaseService);
		mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
	}

	@Test
	void patchUpdatesCaseAndReturnsBody() throws Exception {
		TestSuite suite = new TestSuite();
		suite.setId(99L);
		suite.setName("Suite A");

		TestCase updated = new TestCase();
		updated.setId(5L);
		updated.setName("UI Login");
		updated.setType("UI");
		updated.setStatus("PENDING");
		updated.setUrl("https://example.com");
		updated.setExpectedTitle("WrongValue");
		updated.setTestSuite(suite);

		when(testCaseService.update(eq(5L), any(), any(), any(), any(), any(), any(), any())).thenReturn(updated);

		mockMvc.perform(patch("/api/testcases/5")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "expectedTitle": "WrongValue",
								  "url": "https://example.com",
								  "testSuiteId": 99
								}
								"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(5))
				.andExpect(jsonPath("$.expectedTitle").value("WrongValue"))
				.andExpect(jsonPath("$.testSuiteId").value(99));
	}

	@Test
	void patchReturnsNotFoundWhenServiceRaisesMissingCase() throws Exception {
		when(testCaseService.update(eq(404L), any(), any(), any(), any(), any(), any(), any()))
				.thenThrow(new IllegalArgumentException("TestCase not found: 404"));

		mockMvc.perform(patch("/api/testcases/404")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"expectedTitle\":\"WrongValue\"}"))
				.andExpect(status().isNotFound());
	}
}
