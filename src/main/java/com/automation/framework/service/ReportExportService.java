package com.automation.framework.service;

import com.automation.framework.entity.TestExecution;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class ReportExportService {

	public record ReportFile(byte[] content, String mediaType, String fileName) {
	}

	private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

	private final TestExecutionService testExecutionService;

	public ReportExportService(TestExecutionService testExecutionService) {
		this.testExecutionService = testExecutionService;
	}

	public ReportFile generate(Long executionId, String formatRaw) {
		String format = (formatRaw == null ? "csv" : formatRaw.trim().toLowerCase(Locale.ROOT));
		TestExecution execution = testExecutionService.getById(executionId)
				.orElseThrow(() -> new IllegalArgumentException("TestExecution not found: " + executionId));
		TestExecutionService.ExecutionReportResponse report = testExecutionService.getExecutionReport(executionId);

		return switch (format) {
			case "csv" -> new ReportFile(buildCsv(report), "text/csv", "execution-" + executionId + ".csv");
			case "html" -> new ReportFile(buildHtml(execution, report), "text/html", "execution-" + executionId + ".html");
			case "junit", "xml" -> new ReportFile(buildJunitXml(report), "application/xml", "execution-" + executionId + ".xml");
			default -> throw new IllegalArgumentException("Unsupported format: " + format + ". Use csv, html, or junit.");
		};
	}

	private byte[] buildCsv(TestExecutionService.ExecutionReportResponse report) {
		StringBuilder sb = new StringBuilder();
		sb.append("executionId,suiteDurationMs,testCaseName,status,durationMs,startedAt,endedAt,screenshotPath\n");
		for (TestExecutionService.ExecutionReportRow row : report.rows()) {
			sb.append(report.executionId()).append(',')
					.append(report.suiteDurationMs()).append(',')
					.append(csv(row.testCaseName())).append(',')
					.append(csv(row.status())).append(',')
					.append(row.durationMs()).append(',')
					.append(csv(row.startedAt() != null ? DT.format(row.startedAt()) : "")).append(',')
					.append(csv(row.endedAt() != null ? DT.format(row.endedAt()) : "")).append(',')
					.append(csv(row.screenshotPath() != null ? row.screenshotPath() : ""))
					.append('\n');
		}
		return sb.toString().getBytes(StandardCharsets.UTF_8);
	}

	private byte[] buildHtml(TestExecution execution, TestExecutionService.ExecutionReportResponse report) {
		StringBuilder sb = new StringBuilder();
		sb.append("<!doctype html><html><head><meta charset=\"utf-8\"><title>Execution Report ")
				.append(report.executionId()).append("</title>")
				.append("<style>body{font-family:Arial,sans-serif;padding:20px;}table{border-collapse:collapse;width:100%;}")
				.append("th,td{border:1px solid #ddd;padding:8px;font-size:13px;}th{background:#f4f4f4;text-align:left;}")
				.append(".pass{color:#0a7d2f;font-weight:700}.fail{color:#b00020;font-weight:700}</style></head><body>");
		sb.append("<h2>Execution Report #").append(report.executionId()).append("</h2>");
		sb.append("<p>Status: ").append(escapeHtml(execution.getStatus())).append(" | Total: ")
				.append(execution.getTotalTests()).append(" | Passed: ").append(execution.getPassedTests())
				.append(" | Failed: ").append(execution.getFailedTests()).append(" | Duration(ms): ")
				.append(report.suiteDurationMs()).append("</p>");
		sb.append("<table><thead><tr><th>Test Case</th><th>Status</th><th>Duration(ms)</th><th>Started</th><th>Ended</th><th>Screenshot</th></tr></thead><tbody>");
		for (TestExecutionService.ExecutionReportRow row : report.rows()) {
			String cls = "PASS".equalsIgnoreCase(row.status()) ? "pass" : "fail";
			sb.append("<tr><td>").append(escapeHtml(row.testCaseName())).append("</td>")
					.append("<td class=\"").append(cls).append("\">").append(escapeHtml(row.status())).append("</td>")
					.append("<td>").append(row.durationMs()).append("</td>")
					.append("<td>").append(escapeHtml(row.startedAt() != null ? DT.format(row.startedAt()) : "")).append("</td>")
					.append("<td>").append(escapeHtml(row.endedAt() != null ? DT.format(row.endedAt()) : "")).append("</td>")
					.append("<td>").append(escapeHtml(row.screenshotPath() != null ? row.screenshotPath() : "")).append("</td>")
					.append("</tr>");
		}
		sb.append("</tbody></table></body></html>");
		return sb.toString().getBytes(StandardCharsets.UTF_8);
	}

	private byte[] buildJunitXml(TestExecutionService.ExecutionReportResponse report) {
		long failures = report.rows().stream().filter(r -> !"PASS".equalsIgnoreCase(r.status())).count();
		StringBuilder sb = new StringBuilder();
		sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
		sb.append("<testsuite name=\"execution-").append(report.executionId()).append("\" tests=\"")
				.append(report.rows().size()).append("\" failures=\"").append(failures).append("\">\n");
		for (TestExecutionService.ExecutionReportRow row : report.rows()) {
			sb.append("  <testcase name=\"").append(escapeXml(row.testCaseName())).append("\" time=\"")
					.append(String.format(Locale.ROOT, "%.3f", row.durationMs() / 1000.0)).append("\">");
			if (!"PASS".equalsIgnoreCase(row.status())) {
				sb.append("<failure message=\"Status ").append(escapeXml(row.status())).append("\">");
				if (row.screenshotPath() != null) {
					sb.append("Screenshot: ").append(escapeXml(row.screenshotPath()));
				} else {
					sb.append("No screenshot");
				}
				sb.append("</failure>");
			}
			sb.append("</testcase>\n");
		}
		sb.append("</testsuite>\n");
		return sb.toString().getBytes(StandardCharsets.UTF_8);
	}

	private String csv(String value) {
		String v = value == null ? "" : value;
		return "\"" + v.replace("\"", "\"\"") + "\"";
	}

	private String escapeHtml(String value) {
		if (value == null) {
			return "";
		}
		return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
	}

	private String escapeXml(String value) {
		return escapeHtml(value).replace("'", "&apos;");
	}
}
