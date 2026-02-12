# 🛰️ CSIDC Land Compliance Platform

**AI-Powered Satellite Monitoring for Industrial Land Compliance**

An end-to-end platform built for the **Chhattisgarh State Industrial Development Corporation (CSIDC)** to monitor industrial plots using satellite imagery, detect violations (encroachment, construction, green cover loss), and enforce compliance through automated workflows.

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [API Routes](#-api-routes)
- [Backend Services](#-backend-services)
- [Python Analysis Service](#-python-analysis-service)
- [Frontend Modules](#-frontend-modules)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Running Tests](#-running-tests)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)

---

## 🏗️ Architecture Overview

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend   │────▶│   Go Backend     │────▶│  PostgreSQL +    │
│   (React +   │     │   (Gin REST)     │     │  PostGIS         │
│   Vite)      │     │                  │     └──────────────────┘
└──────────────┘     │  ┌────────────┐  │
                     │  │ Sentinel   │  │     ┌──────────────────┐
                     │  │ Scheduler  │──│────▶│  Python Analysis │
                     │  └────────────┘  │     │  (FastAPI +      │
                     └──────────────────┘     │   OpenCV)        │
                                              └──────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI, Leaflet, Recharts, Zustand, GSAP |
| **Backend** | Go (Gin), GORM, JWT, bcrypt |
| **Analysis** | Python (FastAPI), OpenCV, NumPy, scikit-image (SSIM) |
| **Database** | PostgreSQL 15 + PostGIS 3.4 |
| **Cache** | Redis |
| **Infra** | Docker, Docker Compose |
| **External** | Sentinel Hub API (Sentinel-2 L2A imagery) |

---

## ✨ Features

### 🔐 Authentication & Authorization
- **Dual authentication**: Email (for officials) + Phone number (for industry owners)
- JWT-based stateless authentication with configurable expiry
- Role-Based Access Control (RBAC): `SUPER_ADMIN`, `ADMIN`, `INSPECTOR`, `INDUSTRY_OWNER`
- bcrypt password hashing

### 🗺️ GIS & Map Engine
- Interactive map with Leaflet + React-Leaflet
- PostGIS spatial queries: `ST_AsGeoJSON`, `ST_Intersects`, `ST_MakeEnvelope`
- Plot boundary rendering from GeoJSON polygons
- Bounding box search for visible plots

### 🛰️ Satellite Analysis (Python Microservice)
- **NDVI Analysis**: Vegetation index from Sentinel-2 Red + NIR bands
- **Change Detection**: SSIM-based structural comparison (before vs. after)
- **Sentinel Hub Integration**: Scheduled 10-day image fetching
- Classification: `COMPLIANT` / `WARNING` / `NON_COMPLIANT`

### ⚠️ Violations Management
- Full CRUD with status lifecycle: `DETECTED` → `VERIFIED` → `NOTICE_SENT` → `RESOLVED`
- Before/After image comparison slider
- Confidence scores from AI analysis
- Violation type categorization: Encroachment, Green Cover, Construction

### 🔔 Notification System
- **Broadcast mechanism**: On violation detection, notifies ALL officials (Super Admin, Admin, Inspector) **plus** the plot owner
- Read/unread tracking
- Prepared for email/SMS integration (SMTP/SendGrid)

### 📊 Analytics & Reporting
- Compliance trends over time (Recharts line charts)
- Violation type distribution (pie/bar charts)
- Admin dashboard with aggregate stats

### 👥 Role-Based Views
- **Official Dashboard**: Map, violations table, analytics, admin panel
- **Industry Owner Portal**: Plot status, compliance history, dispute submission
- **Admin Panel**: User management, system-wide statistics

---

## 📁 Project Structure

```
Automated-Satellite-Monitoring-System/
├── frontend/                          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/layout/         # Dashboard shell, sidebar, header
│   │   ├── modules/
│   │   │   ├── auth/                  # Login, Register pages
│   │   │   ├── dashboard/             # Main dashboard
│   │   │   ├── gis/                   # Map component (Leaflet)
│   │   │   ├── violations/            # Violations table + details
│   │   │   ├── reports/               # Analytics charts
│   │   │   ├── industry/              # Industry owner portal
│   │   │   ├── admin/                 # User management
│   │   │   └── plots/                 # Plot registration form
│   │   ├── lib/
│   │   │   ├── api-config.ts          # Global API URL constants
│   │   │   ├── api-client.ts          # Axios client + JWT interceptor
│   │   │   ├── store.ts               # Zustand state management
│   │   │   └── utils.ts               # Utilities
│   │   └── App.tsx                    # Route configuration
│   └── .env                           # VITE_API_URL, VITE_ANALYSIS_URL
│
├── backend/                           # Go (Gin) REST API
│   ├── cmd/server/main.go             # Entry point, route wiring
│   ├── pkg/
│   │   ├── auth/                      # Auth service (JWT + dual auth)
│   │   │   ├── models.go             # User model + DTOs
│   │   │   ├── repository.go         # DB operations
│   │   │   ├── service.go            # Business logic
│   │   │   ├── service_test.go       # Unit tests (8 tests)
│   │   │   ├── handler.go            # HTTP handlers
│   │   │   └── routes.go             # Route registration
│   │   ├── plots/                     # Plot management
│   │   │   ├── models.go / repository.go / service.go
│   │   │   ├── service_test.go       # Unit tests (3 tests)
│   │   │   ├── handler.go / routes.go
│   │   ├── violations/                # Violation CRUD
│   │   │   ├── models.go / repository.go / service.go
│   │   │   ├── service_test.go       # Unit tests (7 tests)
│   │   │   ├── handler.go / routes.go
│   │   ├── gis/                       # Geospatial queries
│   │   │   └── handler.go            # PostGIS spatial handlers
│   │   ├── notifications/             # Broadcast notifications
│   │   │   └── handler.go            # Broadcast + CRUD
│   │   ├── sentinel/                  # Satellite scheduler
│   │   │   └── scheduler.go          # 10-day cycle worker
│   │   └── common/
│   │       ├── db/                    # GORM database connection
│   │       ├── jwt/                   # JWT utility + tests
│   │       │   ├── jwt.go
│   │       │   └── jwt_test.go       # Unit tests (5 tests)
│   │       └── middleware/
│   │           └── auth.go           # JWT + RBAC middleware
│   ├── scripts/
│   │   └── init_schema.sql           # PostGIS schema
│   ├── Dockerfile                    # Multi-stage Go build
│   └── .env                          # DB, JWT, Python service config
│
├── analysis/                          # Python Analysis Microservice
│   ├── main.py                        # FastAPI (NDVI, SSIM, Sentinel)
│   ├── test_analysis.py               # Pytest tests (21 tests)
│   ├── requirements.txt               # Dependencies
│   └── Dockerfile                     # Python container
│
├── docker-compose.yml                 # Full stack orchestration
└── README.md                          # This file
```

---

## 🛣️ API Routes

### Public Routes
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/auth/register` | Register new user (email or phone) |
| `POST` | `/api/auth/login` | Login with email/phone + password |
| `GET`  | `/health` | Server health check |

### Protected Routes (JWT Required)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/plots/register` | Register a new industrial plot |
| `GET`  | `/api/plots/` | List all registered plots |
| `GET`  | `/api/gis/plots` | Get all plots as GeoJSON |
| `GET`  | `/api/gis/plots/:id` | Get single plot geometry |
| `GET`  | `/api/gis/plots/bounds` | Get plots within bounding box |
| `POST` | `/api/violations/` | Report a new violation |
| `GET`  | `/api/violations/` | List all violations |
| `GET`  | `/api/violations/plot/:plotId` | Get violations for a plot |
| `PATCH`| `/api/violations/:id/status` | Update violation status |
| `GET`  | `/api/notifications/` | Get user's notifications |
| `PATCH`| `/api/notifications/:id/read` | Mark notification as read |

### Admin Routes (SUPER_ADMIN / ADMIN only)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET`  | `/api/admin/stats` | System-wide statistics |

### Python Analysis Service (Port 8000)
| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET`  | `/` | Health check |
| `POST` | `/analyze/ndvi` | NDVI vegetation analysis |
| `POST` | `/analyze/compare` | SSIM change detection |
| `POST` | `/analyze/sentinel/fetch` | Fetch Sentinel-2 imagery |

---

## ⚙️ Backend Services

### 1. Auth Service (`pkg/auth/`)
Handles user registration and login with dual authentication (Email for officials, Phone + OTP for industry). Generates JWT tokens with role claims.

### 2. Plots Service (`pkg/plots/`)
Manages industrial plot registration with PostGIS geometry storage via `ST_GeomFromGeoJSON`. Supports listing all plots.

### 3. GIS Service (`pkg/gis/`)
Provides geospatial queries using PostGIS functions — fetch plot boundaries as GeoJSON, query plots within a map viewport bounding box.

### 4. Violations Service (`pkg/violations/`)
Full CRUD for violation records with a lifecycle state machine: `DETECTED → VERIFIED → NOTICE_SENT → RESOLVED`. Stores before/after image URLs and AI confidence scores.

### 5. Notification Service (`pkg/notifications/`)
When a violation is detected, broadcasts alerts to ALL officials (Super Admin, Admin, Inspector) AND the plot owner. Supports read/unread tracking.

### 6. Sentinel Scheduler (`pkg/sentinel/`)
Background goroutine that runs on a 10-day cycle (matching Sentinel-2 revisit period). Iterates all active plots, fetches bounding boxes from PostGIS, and triggers the Python analysis service.

### 7. JWT Middleware (`pkg/common/middleware/`)
Request authentication middleware that validates JWT tokens and injects user context. Includes RBAC middleware for role-restricted routes.

---

## 🐍 Python Analysis Service

Built with **FastAPI + OpenCV + NumPy**, runs as a separate microservice.

| Feature | Algorithm | Thresholds |
|:--------|:----------|:-----------|
| NDVI Analysis | `(NIR - Red) / (NIR + Red)` | `< 0.2`: Non-compliant, `0.2-0.5`: Warning, `> 0.5`: Compliant |
| Change Detection | SSIM (Structural Similarity Index) | `> 0.85`: No change, `0.65-0.85`: Minor, `< 0.65`: Major change |
| Sentinel Fetch | Sentinel Hub API stub | Sentinel-2 L2A, 10m resolution |

---

## 🗄️ Database Schema

PostgreSQL 15 + PostGIS extension with the following tables:

| Table | Description |
|:------|:------------|
| `users` | User accounts (UUID, name, email, phone, password_hash, role) |
| `plots` | Industrial plots (ID, owner_id, area_sqm, location_name, PostGIS geometry) |
| `violations` | Detected violations (UUID, plot_id, type, status, confidence, images) |
| `notifications` | User notifications (UUID, recipient_id, title, message, is_read) |
| `analysis_jobs` | Satellite analysis job tracking (UUID, plot_id, status, NDVI score) |

Schema file: [`backend/scripts/init_schema.sql`](backend/scripts/init_schema.sql)

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend dev)
- Go 1.21+ (for backend dev)
- Python 3.11+ (for analysis service dev)

### Quick Start (Docker)

```bash
# Clone the repository
git clone https://github.com/Akshansh-29072005/Automated-Satellite-Monitoring-System.git
cd Automated-Satellite-Monitoring-System

# Start all services
docker compose up --build

# Services will be available at:
# Backend:  http://localhost:8080
# Analysis: http://localhost:8000
```

### Local Development

```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173

# Backend (requires PostgreSQL + PostGIS)
cd backend
go mod tidy
go run cmd/server/main.go

# Python Analysis
cd analysis
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 🧪 Running Tests

### Go Backend Tests
```bash
cd backend
go test ./... -v
```

**Test Coverage:**
| Package | Tests | Description |
|:--------|:------|:------------|
| `pkg/auth` | 8 | Register (email/phone/duplicate), Login (success/wrong-pass/no-creds/non-existent), bcrypt |
| `pkg/common/jwt` | 5 | Generate, validate, invalid, tampered, all roles |
| `pkg/violations` | 7 | Create, default status, list all, filter by plot, lifecycle, non-existent, types |
| `pkg/plots` | 3 | Register, default status, list all |

### Python Analysis Tests
```bash
cd analysis
pip install pytest httpx
pytest test_analysis.py -v
```

**Test Coverage:**
| Class | Tests | Description |
|:------|:------|:------------|
| `TestNDVICalculation` | 4 | Healthy vegetation, barren land, range validation, zero division |
| `TestVegetationClassification` | 3 | Non-compliant, warning, compliant thresholds |
| `TestSSIMComputation` | 4 | Identical images, different images, range, different sizes |
| `TestNDVIEndpoint` | 2 | Full NDVI analysis, response field types |
| `TestCompareEndpoint` | 2 | Image comparison, response types |
| `TestSentinelFetchEndpoint` | 2 | Fetch request, response fields |
| `TestHealthEndpoint` | 1 | Health check |
| `TestValidation` | 2 | Missing fields validation |

### Frontend Build Verification
```bash
cd frontend
npm run build        # TypeScript + Vite production build
```

---

## 🔧 Environment Variables

### Backend (`.env`)
| Variable | Default | Description |
|:---------|:--------|:------------|
| `DB_HOST` | `db` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |
| `DB_NAME` | `csidc_compliance` | Database name |
| `PORT` | `8080` | Server port |
| `JWT_SECRET` | — | JWT signing secret |
| `PYTHON_SERVICE_URL` | `http://python-service:8000` | Analysis service URL |
| `SENTINEL_CLIENT_ID` | — | Sentinel Hub Client ID |
| `SENTINEL_CLIENT_SECRET` | — | Sentinel Hub Client Secret |

### Frontend (`.env`)
| Variable | Default | Description |
|:---------|:--------|:------------|
| `VITE_API_URL` | `http://localhost:8080` | Backend API URL |
| `VITE_ANALYSIS_URL` | `http://localhost:8000` | Analysis service URL |

---

## 🚢 Deployment

### Docker Compose (Production)
```bash
docker compose -f docker-compose.yml up -d --build
```

### Services
| Service | Port | Container |
|:--------|:-----|:----------|
| Go Backend | 8080 | `backend` |
| Python Analysis | 8000 | `python-service` |
| PostgreSQL + PostGIS | 5432 | `db` |
| Redis | 6379 | `redis` |

---

## 📄 License

This project is developed for CSIDC (Chhattisgarh State Industrial Development Corporation) land compliance monitoring.

---

<p align="center">
  Built with ❤️ for Smart Governance
</p>