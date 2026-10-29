 HEAD
# Eco Track 🌿

> **AI-Powered Carbon Footprint Tracking, Verification, Reduction, and Rewards Platform for India**  
> *Built for Hack Fest 2026 • Problem PS-01*

---

## 📂 Clean Three-Folder Project Architecture

The codebase is organized into three primary, isolated modules:

```
carbonkatha/
├── frontend/               # React 18 + Vite 5 + TailwindCSS + Recharts
│   ├── src/
│   │   ├── pages/         # 12 modules (Log, Dashboard, WhatIf, Progress, Actions, Challenges, Leaderboard, Evidence, Family, Org, Rewards, Login)
│   │   ├── components/    # Navbar, AiChatWidget, Footer
│   │   ├── api/           # Unified API Client (client.js) with dynamic token injection & mock fallback
│   │   └── i18n.js        # Vernacular dictionaries for EN, HI, TA, TE
│   └── dist/              # Production optimized static build
│
├── backend/                # Python FastAPI + PostgreSQL 18 Engine
│   ├── routers/           # Auth, Activities, Calculator, Evidence, Family, Organization, GPS, Rewards, Assistant, Parse, Voice, System
│   ├── services/          # CalculationEngine (CEA v19), EvidenceService (SHA-256), RewardsService, VoiceService
│   ├── tests/             # End-to-end verification suites
│   ├── database.py        # PostgreSQL connection pool with PBKDF2 hashing, DictCursor, and SQLite fallback
│   └── main.py            # FastAPI ASGI application mounting API & static frontend
│
└── api/                    # AI Engine, NLP Parsers, Prompts & Vernacular Training Corpus
    ├── claude_client.py   # Anthropic Claude 3 Haiku client
    ├── fallback_engine.py # Multilingual keyword fallback parser with vernacular number support
    ├── config.py          # API keys & model configuration
    ├── corpus/            # 60 ground-truth training exemplars in EN, HI, TA, TE
    └── prompts/           # Few-shot system prompt templates
```

*(Note: `ai_models/` is maintained as a zero-overhead compatibility bridge forwarding to `api/`).*

---

## 🔗 Frontend-Backend Variable Synchronization

Variable discrepancies between the frontend and backend have been harmonized directly in the **backend**:
- **Quantity & Value**: The backend now transparently accepts either `value` (frontend) or `quantity` (backend), and returns both in responses.
- **Date Format**: Accepts either `date` or `activity_date` across all activity APIs.
- **Account Type**: Accepts `account_type` or `accountType`.
- **Target ID**: Accepts `target_id` or `targetId`.
- **Progress Trajectory (`GET /api/progress` & `/progress`)**: Calculates real footprint from PostgreSQL history and outputs `{ baseline_kg_daily, current_kg_daily, reduction_percentage, kg_saved_total, rupees_saved_total, trees_equivalent, history }`.
- **What-If Simulation (`POST /api/whatif` & `/whatif`)**: Dynamically computes AC, transit, dietary, and solar savings.
- **Dual Routing**: All routes are accessible via both `/api/<route>` and root `/<route>`.

---

## 🚀 Live Local Application URLs

- **Vite Frontend (Hot Reload)**: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Login & Registration Portal**: [http://127.0.0.1:5173/login](http://127.0.0.1:5173/login)
- **FastAPI Backend**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger API Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Endpoint**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

## 🌟 What Was Built & Implemented

### 1. Dedicated Login & Registration for Individuals and Organizations
- Dedicated route [`/login`](http://127.0.0.1:5173/login) and [`/register`](http://127.0.0.1:5173/register).
- Mode toggle: **Sign In** vs. **Create Account**.
- Account Type tabs:
  - 👤 **Individual**: Name, Email, Password, City, State, Preferred Language, Household Size.
  - 🏢 **Organization**: Org Name, Industry (IT, Manufacturing, Retail, Healthcare, CleanTech), Org Type (Pvt Ltd, Public, MSME, Startup), Headcount, City, State, Business Email.
  - 🏡 **Family / Household**: Family Name, Member Count, Household Type, City, State, Email.
- **1-Click Hackathon Evaluator Login**: Instant 1-click authentication for Arjun (Individual), EcoCorp (Organization), and Sharma Family (Household).

### 2. Local PostgreSQL 18 Database with Full Precautions
- **PostgreSQL 18** running locally on port 5432, database `carbonkatha`.
- **Security Precautions**:
  - Strictly parameterized SQL queries preventing any SQL injection vulnerability.
  - **PBKDF2-HMAC-SHA256** password hashing with 100,000 iterations and 32-byte cryptographic salts.
  - Foreign key constraints with `ON DELETE CASCADE`.
  - Transaction safety with `SAVEPOINT` sequence retrieval.
  - Dual-engine fallback: transparently falls back to SQLite if PostgreSQL is ever temporarily offline.

### 3. Exhaustive Regional Language Translation (All Webpage Text)
- Complete UI translation in **English**, **हिन्दी (Hindi)**, **தமிழ் (Tamil)**, and **తెలుగు (Telugu)**.
- When switching language from the top bar (`EN` | `हिं` | `த` | `తె`), **every single text element on the webpage converts instantly**:
  - Navigation bar, buttons, and demo account menus.
  - Login & registration forms, labels, error notices, and placeholders.
  - 7 daily life category cards, units, and assumptions.
  - Dashboard analytics, charts, CEA grid factor notices, and equivalents.
  - Evidence verification center, 8-stage pipeline, and anti-fraud alerts.
  - Family hub, shared utility deduplication notes, and collective goals.
  - Organization ESG portal, Scope 1/2/3 breakdown, and ESG report generator.
  - Rewards marketplace, Carbon Coins balance, and partner voucher wallet.
  - GPS transit simulator (Delhi Metro, BMTC Bus, Chennai Marina Beach cycle).
  - Floating multilingual AI assistant.

### 4. Regional Voice Recognition & Text-to-Speech (TTS)
- Voice recording adapts dynamically to the selected language (`hi-IN`, `ta-IN`, `te-IN`, `en-IN`).
- AI assistant responses and daily routine insights include regional **Text-to-Speech audio playback** (`Volume2` button) so users can hear the advice spoken fluently in Hindi, Tamil, Telugu, or English!

### 5. High-Precision AI Model Training
- Expanded ground-truth training corpus with **60 multilingual samples** across all 7 Indian emissions categories.
- Rule-based grammar engine trained on Indian vernacular number words (`ek`, `do`, `teen`, `chaar`, `paanch`, `दस`, `బీస్`, `ஒன்று`, `இரண்டு`, `మూడు`) and regional units.

---

## 👥 Instant Demo Accounts

| Role | Email | Password | Pre-Loaded Features |
| :--- | :--- | :--- | :--- |
| **Individual Demo** | `arjun.demo@carbonkatha.in` | `DemoUser@2026` | 14 logged activities, verified BESCOM bill, 175 Carbon Coins, GPS trips |
| **Organization Demo** | `ecocorp.hq@carbonkatha.in` | `DemoUser@2026` | 85 employees, 3 branches, Scope 1/2/3 breakdown, ESG audit report |
| **Family Demo** | `sharma.family@carbonkatha.in` | `DemoUser@2026` | 4 members, shared whole-home electricity bill, 220 coins |

---

## 🎨 Theme & Palette

Preserved the soothing **Green-Beach Coastal Theme**:
- Deep Forest Seafoam: `#2D6A4F`
- Bright Seafoam Green: `#52B788`
- Soft Sandy Beach Background: `#FAF6F0`
- Deep Coastal Text: `#1C3329`
- Warm Coral Accent: `#E76F51`
=======
# coresync-t3-03
Official HackFest 2026 repository for team CoreSync (T3-03).
 0d68b55ad34787513c4bac546eb5e88e5981a729
