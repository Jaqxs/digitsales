# ☁️ Cloud Deployment Guide (Real-Time Backend)

This guide explains how to deploy the entire Digitsales platform (Frontend, Backend API, and Database) to the cloud so it works in real-time across multiple devices.

## 🚀 One-Click Deployment with Render

We have added a `render.yaml` configuration file. This allows you to deploy the entire stack to [Render.com](https://render.com) for free with almost no manual configuration.

### Steps to Deploy

1. **Push your code to GitHub:**
   Make sure all the recent changes are pushed to your GitHub repository.
   ```bash
   git add .
   git commit -m "feat: real-time cloud backend integration"
   git push origin main
   ```

2. **Create a Render Account:**
   Go to [Render](https://render.com) and sign up using your GitHub account.

3. **Deploy using Blueprint:**
   * In the Render dashboard, click **"New +"** and select **"Blueprint"**.
   * Connect your GitHub account and select your `digitsales` repository.
   * Render will automatically detect the `render.yaml` file.
   * Click **"Apply"**.

4. **What Render will build automatically:**
   * A **PostgreSQL Database** (`digitsales-db`).
   * A **Node.js Express Backend** (`digitsales-api`).
   * A **Static Site Frontend** (`digitsales-frontend`).

5. **Final Configuration (IMPORTANT):**
   * Wait for the Backend API (`digitsales-api`) to finish deploying. Copy its URL (e.g., `https://digitsales-api.onrender.com`).
   * Go to the Frontend service (`digitsales-frontend`) in the Render dashboard.
   * Go to **Environment**, and manually set `VITE_API_URL` to your backend URL followed by `/api/v1`.
     * Example: `VITE_API_URL` = `https://digitsales-api.onrender.com/api/v1`
   * Go to the Backend service (`digitsales-api`) -> Environment, and change `CORS_ORIGIN` to your deployed frontend URL (e.g., `https://digitsales-frontend.onrender.com`).
   * **Trigger a manual deploy** of the frontend to apply the new environment variable.

## 🛠️ How the Real-Time Integration Works

1. **Authentication:**
   We updated `src/contexts/AuthContext.tsx`. It now sends login/register requests to the Express backend. It securely stores the received `JWT token` and automatically attaches it to all future API requests.
   * *Fallback:* If the backend is unreachable (e.g., no internet or server asleep), it gracefully falls back to local storage auth so the app doesn't crash.

2. **Data Stores (Zustand):**
   We overhauled `src/stores/dataStore.ts`. It now natively communicates with the backend `api.ts` for all CRUD operations (Products, Customers, Employees, Sales).
   * Data is fetched from the PostgreSQL database in real-time.
   * Optimistic UI updates ensure the app feels lightning fast (updates the UI instantly before the server responds).
   * Data is cached locally so the app works even on slow connections.

3. **Database Migration on Startup:**
   The `render.yaml` contains the `startCommand: npx prisma migrate deploy && npm start`. This ensures your PostgreSQL tables are automatically created/updated whenever you deploy!
