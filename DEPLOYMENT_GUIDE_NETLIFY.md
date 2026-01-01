# Deployment Fix Guide (Netlify Frontend + Dokploy Backend)

You have two separate applications talking to each other. They need to be introduced properly.

## 1. The Frontend (Netlify) needs to know WHERE the Backend is.
Currently, your frontend is trying to call a URL with `< >` brackets in it, which is breaking the request.

**Action:**
1.  Log in to **Netlify**.
2.  Select your site.
3.  Go to **Site configuration** -> **Environment variables**.
4.  Find (or add) the variable `VITE_API_URL`.
5.  Set the value to your **REAL Backend URL**.
    *   **WRONG:** `https://<api.zantrixgroup.com>/api/v1` (Do not use brackets)
    *   **CORRECT:** `https://api.zantrixgroup.com/api/v1`
    *(Note: Ensure it ends with `/api/v1`)*
6.  **Important:** Go to the "Deploys" tab and **Trigger a new deploy** (Clear cache and deploy site) for this change to take effect.

---

## 2. The Backend (Dokploy) needs to ALLOW the Frontend.
This is called **CORS** (Cross-Origin Resource Sharing). By default, your backend ignores requests from unknown websites for security. You must tell it that your Netlify site is safe.

**Action:**
1.  Log in to **Dokploy**.
2.  Go to your **Backend Application**.
3.  Click on the **Environment** tab.
4.  Find (or add) the variable `CORS_ORIGIN`.
5.  Set the value to your **Netlify URL** (and localhost for testing).
    *   **Value:** `https://your-site-name.netlify.app,http://localhost:5173`
    *(Replace `your-site-name.netlify.app` with the actual URL you see in your browser when visiting your site)*
6.  **Save** and **Redeploy** the Backend application.

## Summary
- **Netlify** needs `VITE_API_URL` pointing to Dokploy (Backend).
- **Dokploy** needs `CORS_ORIGIN` pointing to Netlify (Frontend).
