# 🚀 Automated Regression Test Suite Framework

## 📌 Project Overview

This project is a full-stack **Automation Testing Framework** designed to manage and execute regression tests for web and API applications.

It supports:

* UI Testing using Selenium
* API Testing using REST-Assured
* Parallel Test Execution
* Test Management using Spring Boot APIs
* Interactive Dashboard using React + Tailwind

---

## 🛠️ Tech Stack

### Backend

* Java 17
* Spring Boot
* Spring Data JPA
* MySQL
* Selenium
* REST-Assured

### Frontend

* React (Vite)
* Tailwind CSS
* Axios
* Recharts

---

## ✨ Features

* Create and manage test suites and cases
* Parallel suite execution (thread pool)
* UI (Selenium) and API (REST Assured) tests
* Schedules, HTML/CSV/JUnit reports, logs, screenshots
* Analytics dashboard (trends, hotspots, filters)
* Optional demo seed and scripted end-to-end API flow

---

## Complete end-to-end flow

**Prerequisites:** JDK 17, Maven, MySQL with database `automation_framework` (see `application.properties`), network access for API tests (jsonplaceholder.typicode.com).

1. **First-time demo data (empty database only)**  
   Set `automation.demo.seed=true` in `src/main/resources/application.properties`, then start the backend once.  
   This creates **E2E Demo Suite** with two **API** test cases (no browser). Set the flag back to `false` afterward if you do not want seeding on every restart.

2. **Start backend**

   ```bash
   mvn spring-boot:run
   ```

3. **Start dashboard** (separate terminal)

   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

   Open `http://localhost:5173` — use **Execution**, **Dashboard**, **Schedules**, **Test suites** as needed.  
   Optional: copy `dashboard/.env.example` to `.env.local` and set `VITE_API_BASE_URL` if the API is not on `http://localhost:8080`.

4. **Automated API smoke (full chain)**  
   With the backend running:

   ```powershell
   .\scripts\e2e-flow.ps1
   ```

   Or on Git Bash / WSL / Linux (requires `python3` or `python` for JSON):

   ```bash
   chmod +x scripts/e2e-flow.sh
   ./scripts/e2e-flow.sh http://localhost:8080
   ```

   The script calls: health → suites → **POST /api/executions/start** → report → logs → analytics → suite results, and prints report download URLs.

5. **Manual UI path**  
   Select a suite → **Run test suite** → open report / logs / exports on the Execution page; use **Suite history & pass rate** for `GET /api/results/{suiteId}`.

6. **Edit an existing test case (including fail simulation data)**  
   Open **Test Cases** → click **Edit** on a row → update `url` and `expectedTitle` (example: set `expectedTitle` to `WrongValue`) → save.  
   The dashboard calls `PATCH /api/testcases/{id}` so you can force a UI FAIL without changing backend code.

---

## 📂 Project Structure

```
framework/
 ├── src/                # Spring Boot backend
 ├── dashboard/          # React frontend
 ├── pom.xml
 └── README.md
```

---

## ⚙️ How to Run

### 🔹 Backend

```bash
mvn spring-boot:run
```

👉 Runs on:

```
http://localhost:8080
```

---

### 🔹 Frontend

```bash
cd dashboard
npm install
npm run dev
```

👉 Runs on:

```
http://localhost:5173
```

---

## 🧪 API Endpoints (selected)

* `GET /api/health` — Liveness
* `GET/POST /api/testsuites/*`, `GET/POST /api/testcases/*` — Catalog
* `POST /api/executions/start` — Run a suite
* `GET /api/executions/report/{id}` — Per-case report
* `GET /api/reports/generate?executionId=&format=csv|html|junit` — Exports
* `GET /api/logs/{executionId}` — Execution logs
* `GET /api/analytics/trends` — Trends and hotspots
* `GET /api/results/{suiteId}` — Suite-scoped history

---

## 👨‍💻 Author

**Guru Sharan**

---
## Screenshots

#Dashboard Img
<img width="1901" height="1012" alt="image" src="https://github.com/user-attachments/assets/d78d8fb8-c6b8-45c4-a2ca-7c994484bfd7" />


## ⭐ Contribution

Feel free to fork and improve the project!
