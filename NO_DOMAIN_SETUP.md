# How to fix "Registration Failed" without buying a Domain

**The Problem:**
Your frontend (`https://zantrix.netlify.app`) is secure (HTTPS).
Your backend (`http://65.109.140.250`) is insecure (HTTP).
Browsers **BLOCK** secure sites from talking to insecure sites. This is why you get "Failed to fetch".

**The Solution:**
You need a "fake" domain that points to your IP so we can get a security certificate (SSL) for free. We will use a service called `nip.io`.

### Step 1: Your New Backend "Domain"
Your server IP is `65.109.140.250`.
So, your free domain is:
**`65.109.140.250.nip.io`**

### Step 2: Configure Dokploy
1.  Go to **Dokploy** -> **Backend Application**.
2.  Click **Domains**.
3.  Add a new domain:
    *   **Domain:** `65.109.140.250.nip.io`
    *   **Path:** `/`
    *   **Port:** `3001`
    *   **HTTPS:** ✅ ENABLE THIS! (This is the magic part)
4.  Click **Create**.
5.  Wait 1-2 minutes for the "Certificate" to generate. Valid certificates usually show a green lock or "True".

### Step 3: Configure Netlify
1.  Go to **Netlify** -> **Site configuration** -> **Environment variables**.
2.  Update `VITE_API_URL` to use this new secure address:
    *   **Value:** `https://65.109.140.250.nip.io/api/v1`
3.  **Redeploy** your Netlify site.

### Step 4: Configure Backend CORS
1.  Go to **Dokploy** -> **Backend** -> **Environment**.
2.  Update `CORS_ORIGIN`:
    *   **Value:** `https://zantrix.netlify.app`
3.  **Redeploy** your Backend.

Now both are **HTTPS**, and they will happily talk to each other!
