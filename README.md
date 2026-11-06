# ⚡ GridVault – Smart Hybrid Energy Storage and Management System

**An intelligent renewable energy monitoring, battery storage and energy management platform built using Python.**

## 📌 Project Overview

GridVault is a desktop-based hybrid energy management application designed to simulate and monitor renewable energy generation, electricity consumption, and battery storage.

The system integrates simulated solar and wind energy generation with electricity demand and battery storage to intelligently manage energy distribution.

Its primary objective is to maximise renewable energy utilisation, minimise energy wastage, and ensure reliable power availability through an intelligent energy management algorithm.

## 🎯 Objectives

- Monitor solar and wind energy generation.
- Track electricity consumption and demand.
- Monitor battery State of Charge (SOC).
- Simulate battery charging and discharging.
- Intelligently balance energy generation and consumption.
- Store historical energy readings using PostgreSQL.
- Visualise energy statistics through interactive charts.

## ✨ Key Features

### 1. Energy Monitoring Dashboard
- Solar power generation.
- Wind power generation.
- Total electricity demand.
- Battery energy level.
- Battery State of Charge (SOC).

### 2. Renewable Energy Simulation
- Simulated solar energy generation.
- Simulated wind energy generation.
- Dynamic electricity demand.
- Real-time updates to simulated energy readings.

### 3. Intelligent Energy Management
- Automatically detects surplus energy.
- Stores excess renewable energy in the battery.
- Releases stored energy during generation shortages.
- Prevents battery overcharging and excessive discharge.
- Maintains battery operating limits.

### 4. Battery Management
- Battery charging calculations.
- Battery discharging calculations.
- State of Charge monitoring.
- Battery capacity management.

### 5. Historical Data Storage
- PostgreSQL database integration (`psycopg2`) with a 3-table normalized schema (`battery_units`, `energy_readings`, `system_alerts`).
- ACID-compliant transactional logging of simulation steps and automated alerts.
- Historical energy readings and battery performance records.
- Energy generation, consumption tracking, and SQL window-function analytics.

### 6. Analytics and Visualisation
- Energy generation charts.
- Electricity demand charts.
- Battery SOC history.
- Energy utilisation analysis.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Python | Core programming language |
| Tkinter | Desktop graphical interface |
| PostgreSQL (`psycopg2`) | Relational database & analytical SQL queries |
| Matplotlib | Data visualisation |
| NumPy | Numerical calculations |
| Git | Version control |
| GitHub | Source code hosting |

## 🏗️ Project Architecture

```text
GridVault/
│
├── main.py
│
├── energy_manager.py
│
├── simulation.py
│
├── database.py
│
├── requirements.txt
│
├── README.md
│
├── assets/
│
├── screenshots/
│
└── .gitignore
```

### Module Description

| File | Responsibility |
|---|---|
| main.py | Main desktop application and dashboard |
| energy_manager.py | Energy distribution and battery management logic |
| simulation.py | Renewable generation and demand simulation |
| database.py | PostgreSQL schema, ACID transactions, and analytical SQL queries |
| requirements.txt | Python dependencies |
| assets/ | Application resources |
| screenshots/ | Application screenshots |

## ⚙️ Energy Management Algorithm

GridVault follows a rule-based energy management strategy.

**Case 1: Surplus Energy**

When renewable generation exceeds electricity demand:

- Supply the required energy to the load.
- Calculate excess renewable energy.
- Charge the battery using available surplus energy.
- Respect maximum battery capacity.

**Case 2: Energy Deficit**

When electricity demand exceeds renewable generation:

- Utilise available renewable energy first.
- Calculate the energy deficit.
- Discharge the battery to meet the shortage.
- Respect minimum battery State of Charge.

**Case 3: Balanced Energy**

When generation equals demand:

- Supply the load directly.
- Maintain the battery charge level.

## 🔋 Battery Parameters

The simulation uses configurable battery parameters:

- Battery capacity: 100 kWh (default simulation value).
- Initial State of Charge: 50%.
- Minimum State of Charge: 20%.
- Maximum State of Charge: 100%.

These are simulation assumptions, not measurements from physical hardware.

## 🚀 Installation and Setup

### Prerequisites

- Python 3.10 or higher.
- PostgreSQL 16 or higher (running locally or accessible via network).
- Git.
- Tkinter support.

### 1. Clone the repository

```bash
git clone https://github.com/aryan118335/GridVault.git
```

### 2. Navigate to the project

```bash
cd GridVault
```

### 3. Create a virtual environment

```bash
python3 -m venv .venv
```

### 4. Activate the environment

**macOS / Linux**

```bash
source .venv/bin/activate
```

**Windows**

```bash
.venv\Scripts\activate
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure PostgreSQL (optional overrides)

By default, `database.py` connects to PostgreSQL on `localhost:5432` using database `gridvault` and your current OS username, creating the `gridvault` database and tables automatically. Override via environment variables if needed:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=gridvault
export DB_USER=postgres
export DB_PASSWORD=your_password
```

### 7. Verify database integration or run the application

```bash
python database.py
python main.py
```

## 📊 System Workflow

```text
Solar Generation ──┐
                   │
Wind Generation ───┼──> Energy Management System
                   │             │
Electricity Demand ┘             │
                                 ▼
                       Energy Balance Check
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
              Surplus Energy             Energy Deficit
                    │                         │
                    ▼                         ▼
              Charge Battery            Discharge Battery
                    │                         │
                    └────────────┬────────────┘
                                 ▼
                         Update Battery SOC
                                 │
                                 ▼
                        PostgreSQL Database
                     (ACID + Window Analytics)
                                 │
                                 ▼
                          Dashboard & Charts
```

## 👥 Team Members

| Member | Responsibility |
|---|---|
| Aryan | Backend development, APIs and energy management logic |
| Ayush | Database management and data engineering |
| Varad | Frontend development and desktop UI |

## 🔮 Future Scope

- Integration with real solar panels and wind turbines.
- IoT-based energy monitoring.
- Machine learning-based energy demand prediction.
- Weather-based renewable generation forecasting.
- Cloud-based monitoring and remote access.
- Advanced battery health monitoring.

## ⚠️ Project Disclaimer

GridVault is an academic prototype that uses simulated energy generation and consumption data. It is not currently connected to physical renewable energy equipment or a real battery management system.

## 📄 License

This project is developed for academic and educational purposes.

---

**GridVault – Smarter Energy. Sustainable Future. ⚡**