<#
.SYNOPSIS
  End-to-end API smoke: health → suites → run suite → report → logs → analytics → suite results.
  Requires: backend running (e.g. mvn spring-boot:run), optional demo seed (automation.demo.seed=true).

.EXAMPLE
  .\scripts\e2e-flow.ps1
  .\scripts\e2e-flow.ps1 -BaseUrl "http://127.0.0.1:8080"
#>
param(
  [string]$BaseUrl = "http://localhost:8080"
)

$ErrorActionPreference = "Stop"
$root = $BaseUrl.TrimEnd("/")

function Invoke-Json($Method, $Path, $Body = $null) {
  $uri = "$root$Path"
  $params = @{ Uri = $uri; Method = $Method; }
  if ($Body) {
    $params["ContentType"] = "application/json"
    $params["Body"] = ($Body | ConvertTo-Json -Depth 6)
  }
  return Invoke-RestMethod @params
}

Write-Host "=== 1) Health ===" -ForegroundColor Cyan
$h = Invoke-WebRequest -Uri "$root/api/health" -UseBasicParsing
Write-Host $h.Content

Write-Host "`n=== 2) Suites ===" -ForegroundColor Cyan
$suites = Invoke-Json GET "/api/testsuites/all"
if (-not $suites -or $suites.Count -eq 0) {
  Write-Host "No suites. Start once with automation.demo.seed=true (empty DB) or create a suite via POST /api/testsuites/create." -ForegroundColor Yellow
  exit 1
}

$demo = $suites | Where-Object { $_.name -eq "E2E Demo Suite" } | Select-Object -First 1
$suite = if ($demo) { $demo } else { $suites[0] }
$suiteId = $suite.id
Write-Host "Using suite id=$suiteId name=$($suite.name)"

Write-Host "`n=== 3) Cases (sanity) ===" -ForegroundColor Cyan
$cases = Invoke-Json GET "/api/testcases/all"
$count = $cases.Count
Write-Host "Total test cases in DB: $count"

Write-Host "`n=== 4) Run suite (POST /api/executions/start) — may take a minute if UI tests ===" -ForegroundColor Cyan
$startBody = @{
  testSuiteId = $suiteId
  status      = "E2E_SCRIPT"
  totalTests  = 0
  passedTests = 0
  failedTests = 0
}
$ex = Invoke-Json POST "/api/executions/start" $startBody
$execId = $ex.id
Write-Host "Execution id=$execId status=$($ex.status) passed=$($ex.passedTests) failed=$($ex.failedTests)"

Write-Host "`n=== 5) Execution report ===" -ForegroundColor Cyan
$report = Invoke-Json GET "/api/executions/report/$execId"
Write-Host "Rows: $($report.rows.Count) suiteDurationMs=$($report.suiteDurationMs)"

Write-Host "`n=== 6) Logs ===" -ForegroundColor Cyan
try {
  $logs = Invoke-Json GET "/api/logs/$execId"
  $logCount = $logs.Count
  if ($null -eq $logCount) { $logCount = 0 }
  Write-Host "Log entries: $logCount"
} catch {
  Write-Host "Logs endpoint note: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n=== 7) Analytics (trends) ===" -ForegroundColor Cyan
$trends = Invoke-Json GET "/api/analytics/trends?limit=5"
Write-Host "totalExecutions=$($trends.totalExecutions) passRate=$($trends.overallPassRate)%"

Write-Host "`n=== 8) Suite results ===" -ForegroundColor Cyan
$results = Invoke-Json GET "/api/results/$suiteId`?limit=10"
Write-Host "suite=$($results.suiteName) totalRuns=$($results.totalExecutions) overallPass=$($results.overallPassRate)%"

Write-Host "`n=== 9) Reports export (URLs) ===" -ForegroundColor Cyan
Write-Host "CSV:   $root/api/reports/generate?executionId=$execId&format=csv"
Write-Host "HTML:  $root/api/reports/generate?executionId=$execId&format=html"
Write-Host "JUnit: $root/api/reports/generate?executionId=$execId&format=junit"

Write-Host "`nDone. Open dashboard: cd dashboard && npm run dev → http://localhost:5173 (Execution page)." -ForegroundColor Green
