# ⚡ ThermalWatchAI: AI-Powered Thermal Power Plant Monitoring & Fault Detection Platform

<p>
  <img src="https://img.shields.io/badge/React.js-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat-square&logo=sqlalchemy&logoColor=white" alt="SQLAlchemy">
  <img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white" alt="Scikit-Learn">
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Recharts-FF6384?style=flat-square" alt="Recharts">
</p>

ThermalWatch is a centralized web-based platform designed to monitor thermal power plant operations, track equipment health, and detect operational faults using Artificial Intelligence.

The system enables plant managers, engineers, and administrators to monitor multiple power plants from a single dashboard, analyze operational metrics, predict equipment faults, and streamline maintenance workflows through automated request generation.

By combining **Machine Learning**, **Industrial Analytics**, and **Modern Web Technologies**, ThermalWatch provides a complete solution for real-time thermal power plant monitoring and decision-making.

---

# 🌟 Key Features

## 🏭 Plant & Unit Monitoring

* Monitor multiple thermal power plants from a centralized dashboard.
* Track generation units and their operational status.
* View plant-wise and unit-wise performance metrics.

## 🤖 AI-Powered Fault Detection

* Detect abnormal operating conditions using Machine Learning.
* Analyze turbine RPM, steam temperature, and pressure.
* Predict potential equipment faults with confidence scores.

## 📊 Real-Time Analytics Dashboard

* Power generation monitoring
* Unit performance tracking
* Fault distribution analysis
* Request trend visualization
* Plant comparison reports

## 🎫 Maintenance Request Management

* Automatically generate maintenance requests for faulty units.
* Priority-based ticket system (Low, Medium, High).
* Request tracking and status management.

## 🔐 Secure Role-Based Access Control

* JWT-based authentication
* Engineer and Admin roles
* Protected API endpoints and dashboards

## 🧠 AI Plant Assistant

* Gemini-powered conversational assistant
* Generate maintenance summaries
* Query plant performance using natural language
* Retrieve operational insights instantly

---

# 🏗️ Technical Architecture

## 1. Monitoring Engine

The monitoring engine serves as the core operational layer of ThermalWatch.

It continuously tracks:

* Unit Status
* Turbine RPM
* Steam Temperature
* Pressure
* Power Output
* Plant Performance Metrics

The collected telemetry data is processed and visualized through interactive dashboards.

---

## 2. Fault Detection Engine

The fault detection module utilizes Machine Learning models to identify abnormal operating conditions.

### Input Parameters

* Turbine RPM
* Steam Temperature
* Pressure

### Output

* Fault Class
* Confidence Score
* Severity Level

Example:

```text
Fault Type: Blade Deformation
Confidence Score: 96.8%
Severity: High
```

### Models Used

* Random Forest
* XGBoost
* Scikit-Learn Pipeline

---

## 3. Maintenance Management Engine

Whenever a fault is detected:

```text
Fault Detected
      ↓
Raise Request
      ↓
Assign Priority
      ↓
Admin Review
      ↓
Mark Repaired / Drop Unit
```

This workflow ensures accountability and rapid response to operational issues.

---

## 4. AI Assistant Layer

Gemini API powers an intelligent assistant capable of answering questions such as:

```text
Which plant generated the highest number of faults this month?

Show maintenance requests for Ahmedabad Power Plant.

Generate a weekly operational summary.
```

---
# 📊 Machine Learning Pipeline

## Dataset Features

* Turbine RPM
* Steam Temperature
* Pressure
* Unit Status
* Operational Metrics

## Fault Classes

* Normal
* Blade Deformation
* Turbine Inefficiency
* Pressure Anomaly
* Overheating

## Training Workflow

```text
Data Collection
        ↓
Preprocessing
        ↓
Feature Engineering
        ↓
Model Training
        ↓
Evaluation
        ↓
Deployment
```

---

# 📈 Dashboard Metrics

## Global Dashboard

* Total Plants
* Total Units
* Running Units
* Faulty Units
* Open Requests
* Net Power Output

## Plant Dashboard

* Unit Health Status
* Fault Trends
* Maintenance Requests
* Power Generation Statistics

## Analytics

* Fault Distribution
* Request Trends
* Plant Performance Comparison
* Unit Performance Reports

---

# 🔐 Authentication & User Roles

## Guest

* View dashboards

## Engineer

* Execute diagnostics
* Raise requests
* View request history

## Admin

* Manage plants
* Manage units
* Manage engineers
* Mark repairs
* Drop units

---
# 🛠️ Tech Stack

## Frontend

* React.js
* Vite
* Recharts
* CSS (Crimson Industrial Theme)

## Backend

* Python
* Flask
  
## Database

* MySQL
* SQLAlchemy ORM

## Authentication

* JWT Authentication

## Machine Learning

* Scikit-Learn
* Random Forest
* XGBoost

## AI Integration

* Gemini API

---

# 📂 Project Structure

```text
ThermalWatch/

ThermalWatchAI/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI parts (Charts, Layouts, Modals, Widgets)
│   │   ├── pages/            # Page-level components (Home, Plant, FaultDetection, etc.)
│   │   ├── contexts/         # React Contexts (AuthContext, ToastContext)
│   │   ├── hooks/            # Custom React Hooks (useAuth)
│   │   ├── services/         # Frontend API integration (api.js)
│   │   └── assets/           # Static assets like images/icons
│   ├── public/               # Publicly accessible files (favicon, etc.)
│   └── package.json          # Node dependencies and scripts
├── backend/
│   ├── app.py                # Main Flask application entry point
│   ├── routes.py             # All REST API endpoints and controllers
│   ├── models.py             # SQLAlchemy database models (Plant, Unit, User, etc.)
│   ├── ai_service.py         # Google Gemini AI assistant orchestration
│   ├── ml_service.py         # Random Forest fault detection ML models
│   ├── auth_middleware.py    # JWT authentication logic
│   ├── email_service.py      # Automated email notification system
│   ├── seeder.py             # Script to populate dummy data
│   ├── reset_db.py           # Database wipe/reset utility
│   ├── requirements.txt      # Curated list of Python backend dependencies
│   └── models/               # (Legacy/Additional Model Definitions)
├── database/                 # SQLite/PostgreSQL storage directory
├── README.md                 # Project documentation
└── .env                      # Environment variables (DB credentials, API Keys)
```

---

# 🚀 Getting Started

## 1. Prerequisites

Ensure you have the following installed:

* Python 3.10+
* Node.js 18+
* MySQL Server

---

## 2. Clone Repository

```bash
git clone https://github.com/yourusername/ThermalWatch.git

cd ThermalWatch
```

---

## 3. Install Frontend Dependencies

```bash
cd frontend

npm install
```

---

## 4. Install Backend Dependencies

```bash
cd backend

pip install -r requirements.txt
```

---

## 5. Configure Database

Create a MySQL database:

```sql
CREATE DATABASE thermalwatch;
```

Update the `.env` file with your database credentials.

---

## 6. Run Backend Server

### Flask

```bash
python app.py
```

### FastAPI

```bash
uvicorn app:app --reload
```

---

## 7. Run Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🤝 Contributing

Contributions, suggestions, and feature requests are welcome.

Feel free to fork the repository, open issues, and submit pull requests to improve ThermalWatch.

---

© 2026 Kunal Singh
