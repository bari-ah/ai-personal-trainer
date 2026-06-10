# Upsell.AI — Elite Health Club CRM & Intelligent Trainer Advisor

A fully-integrated, intelligent CRM and real-time upselling/retention platform designed specifically for luxury fitness destinations. Built with an Express + Node.js backend acting as a secure gateway for the elite Google Gemini API, and a beautiful, custom React frontend designed for high-end operations.

---

## 🏋️‍♂️ Overview

**Upsell.AI** acts as the command center for premier fitness clubs (such as *Flintstone Shine Sport Gym*). It bridges the gap between active training floors, front-desk concierges, and club management by analyzing member rosters, trainer utilization, and real-time attendance logs to surface critical action items, retention risks, and personalized, copy-to-send VIP upselling scripts.

### Key Features
- **🚨 Intelligent Alert System**: Real-time detection of high-risk dropouts, scheduling inconsistencies, and upcoming membership renewals.
- **💬 AI-Powered VIP Outreach**: Dynamically generates tailored, high-empathy communication scripts (perfect for WhatsApp/SMS) targeting member distress points, wedding preparations, or nutritional upgrades.
- **📊 Interactive Management Panel**: Edit client status, manage coach assignments, and logs direct performance updates.
- **🔒 Secure Architecture**: Zero API keys are exposed to the client-side. All calls are securely proxied through the server-side Express middle-tier.
- **🚀 Serverless Ready**: Configured for seamless deployment to serverless environments like Vercel with optimized build setups.

---

## 🛠️ Technology Stack

- **Frontend**: React (18+), Vite, Tailwind CSS (Modern Theme), Motion (Micro-interactions & transitions), Lucide Icons.
- **Backend**: Express, Node.js (TypeScript with ESM/CJS compilation via esbuild), Google Gen AI SDK (`@google/genai`).
- **Deployment**: Multi-environment config supporting standard Standalone Node servers and Serverless API runtimes (Vercel, Cloud Run).

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (packaged with Node.js)

### 1. Installation
Clone your repository, navigate to the project directory, and install dependencies:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory (you can copy `.env.example` as a template):
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. Running the App Locally

**Development Mode**:
Runs the Vite development server with hot-reloading for the frontend, combined with the live Express server.
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

**Production Build & Start**:
Bundles the frontend static assets and compiles the backend TypeScript server into a self-contained, enterprise-grade production bundle under `dist/server.cjs`.
```bash
npm run build
npm start
```

---

## ☁️ Deploying to Vercel

This repository is pre-configured with a universal `vercel.json` structure and a serverless API gateway (`api/index.ts`) routing all requests seamlessly.

1. Install the Vercel CLI or link your GitHub repository to Vercel.
2. In your Vercel project settings, configure your Environment Variables:
   - Add `GEMINI_API_KEY` with your actual Google Gemini API key.
3. Deploy the project. Vercel will automatically read `vercel.json` and host both your React SPA and backend Express routes seamlessly.
