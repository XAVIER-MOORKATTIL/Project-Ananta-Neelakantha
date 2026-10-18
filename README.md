# ⚡ Project Ananta-Neelakantha

An advanced Ascent-architecture backend built with TypeScript, Node.js, Express, and MongoDB. Equipped with **Parvati's Throat Poison Shield** for NoSQL injection neutralization, an auto-mutating **Circuit Breaker** state machine for self-healing threat isolation, and the **Cosmic Mirror Dashboard** for live telemetry visualization.

---

## 🛠️ Tech Stack & Features

* **Runtime:** Node.js (v24+) / TypeScript (`tsx`)
* **Framework:** Express.js & CORS
* **Database:** MongoDB Atlas (Immutable State Store)
* **Security Middleware:** Custom `poisonShield` NoSQL Injection Guard
* **Resilience:** Auto-Mutating Circuit Breaker (`CLOSED` ↔ `OPEN` ↔ `HALF-OPEN`)
* **Visualization:** Real-time Single Page Telemetry Dashboard (`/public`)

---

## 🚀 Quickstart (Local Development)

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   cd project-neelakantha   

## Install dependencies:

Bash
npm install

## Configure Environment Variables:
Create a .env file in the root directory:

Code snippet
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/neelakantha_core

## Start Development Server:

Bash
npx tsx server.ts

## Access Dashboard:
Open http://localhost:5000 in your browser.