#!/usr/bin/env bash
# Same flow as e2e-flow.ps1 (Git Bash / WSL / macOS / Linux)
set -euo pipefail
ROOT="${1:-http://localhost:8080}"
ROOT="${ROOT%/}"

PY=""
if command -v python3 >/dev/null 2>&1; then PY=python3
elif command -v python >/dev/null 2>&1; then PY=python
fi
if [ -z "$PY" ]; then
  echo "Need python3 or python in PATH to parse JSON, or use scripts/e2e-flow.ps1 on Windows."
  exit 1
fi

echo "=== 1) Health ==="
curl -fsS "$ROOT/api/health"
echo

echo
echo "=== 2) Suites ==="
SUITES=$(curl -fsS "$ROOT/api/testsuites/all")
SUITE_ID=$(echo "$SUITES" | "$PY" -c "import sys,json; a=json.load(sys.stdin); print(a[0]['id'] if a else '')")
if [ -z "$SUITE_ID" ]; then
  echo "No suites. Use automation.demo.seed=true on empty DB or create a suite."
  exit 1
fi
echo "Using suite id=$SUITE_ID"

echo
echo "=== 4) Run suite ==="
EX_JSON=$(curl -fsS -X POST "$ROOT/api/executions/start" \
  -H "Content-Type: application/json" \
  -d "{\"testSuiteId\":$SUITE_ID,\"status\":\"E2E_SCRIPT\",\"totalTests\":0,\"passedTests\":0,\"failedTests\":0}")
EXEC_ID=$(echo "$EX_JSON" | "$PY" -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Execution id=$EXEC_ID"

echo
echo "=== 5) Report ==="
curl -fsS "$ROOT/api/executions/report/$EXEC_ID" | head -c 500
echo "..."

echo
echo "=== 6) Logs ==="
curl -fsS "$ROOT/api/logs/$EXEC_ID" | head -c 500
echo "..."

echo
echo "=== 7) Analytics ==="
curl -fsS "$ROOT/api/analytics/trends?limit=5" | head -c 500
echo "..."

echo
echo "=== 8) Suite results ==="
curl -fsS "$ROOT/api/results/$SUITE_ID?limit=10"
echo

echo
echo "Done. Dashboard: cd dashboard && npm run dev"
