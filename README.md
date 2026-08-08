# PUBG Insight Frontend

Frontend application for **PUBG Insight – AI-powered Performance Analytics Platform**.

This repository contains the React web application that interacts with the backend REST API and visualizes PUBG player analytics.

---

# Project Overview

The frontend provides an intuitive interface for users to:

- Search PUBG players
- View player statistics
- Explore recent matches
- Read AI-generated performance insights
- Track historical analysis
- Visualize performance trends

The frontend contains no business logic. All data processing is performed by the backend.

---

# Responsibilities

The frontend is responsible for:

- User Interface
- Routing
- Calling backend REST APIs
- Displaying analytics
- Rendering charts
- Managing application state

---

# Technology Stack

| Category | Technology |
|-----------|------------|
| Framework | React |
| Language | TypeScript |
| Build Tool | Vite |
| UI Library | Material UI |
| HTTP Client | Axios |
| Routing | React Router |
| Charts | Recharts |
| State | React Context (initially) |

---

# High-Level Architecture

```
User

    │

    ▼

React Application

    │

    ▼

Spring Boot REST API

    │

    ▼

AWS + External APIs
```

---

# Planned Folder Structure

```
src

├── api
├── assets
├── components
├── layouts
├── pages
├── routes
├── services
├── types
├── hooks
├── utils
└── contexts
```

---

# Planned Pages

- Home
- Player Search
- Player Profile
- Match History
- AI Analysis
- Analytics Dashboard
- History

---

# Development Workflow

```
User Action

      │

      ▼

React Component

      │

      ▼

Axios

      │

      ▼

Backend REST API

      │

      ▼

Render UI
```

---

# Current Development Roadmap

- [ ] Initialize React project
- [ ] Configure routing
- [ ] Configure Material UI
- [ ] Configure Axios
- [ ] Health Check connection
- [ ] Player Search page
- [ ] Player Profile page
- [ ] AI Analysis page
- [ ] Dashboard page
- [ ] History page

---

# Environment Variables

```
VITE_API_BASE_URL=http://localhost:8080
```

---

# Running the Project

```bash
npm install

npm run dev
```

Frontend runs on

```
http://localhost:5173
```

---

# Project Status

🚧 Under Development