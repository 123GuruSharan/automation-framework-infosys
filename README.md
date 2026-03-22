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

* ✅ Create and manage Test Suites
* ✅ Create and manage Test Cases
* ✅ Execute test suites
* ✅ UI & API test integration
* ✅ Dashboard with live data visualization
* 🔜 Parallel Execution (in progress)
* 🔜 Reporting system (HTML/CSV)

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

## 🧪 API Endpoints

* `GET /api/health` → Check server status
* `GET /api/testcases/all` → Get all test cases
* `POST /api/testcases/create` → Create test case
* `GET /api/testsuites/all` → Get all test suites
* `POST /api/testsuites/create` → Create test suite
* `POST /api/executions/start` → Run test suite

---

## 📊 Future Enhancements

* Parallel Execution using multithreading
* Detailed Reporting (HTML/CSV)
* Screenshot capture on failure
* Analytics dashboard
* Scheduled test execution

---

## 👨‍💻 Author

**Guru Sharan**

---

## ⭐ Contribution

Feel free to fork and improve the project!
