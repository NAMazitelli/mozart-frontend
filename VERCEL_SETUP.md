# Vercel Environment Variables Setup

## The Issue
Environment variables in frontend applications work differently than backend applications. They are embedded into the build at **build time**, not runtime.

## Solution Steps

### 1. Set Environment Variables in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your production backend URL (e.g., `https://your-backend.herokuapp.com/api`)
   - **Environments**: Select "Production" (and "Preview" if needed)

### 2. Important Notes for Frontend Environment Variables

- **Must start with `VITE_`**: Only environment variables prefixed with `VITE_` are accessible in the frontend code
- **Build-time injection**: Variables are embedded during the build process, not at runtime
- **Public by nature**: All `VITE_*` variables are publicly accessible in the browser

### 3. Different Environment Setup

For different environments, set up multiple environment variables:

**Development:**
- Usually handled by your local `.env` file
- `VITE_API_URL=http://localhost:3000/api`

**Production:**
- Set in Vercel Dashboard
- `VITE_API_URL=https://your-production-backend.com/api`

**Preview/Staging:**
- Set in Vercel Dashboard for "Preview" environment
- `VITE_API_URL=https://your-staging-backend.com/api`

### 4. Vercel CLI Alternative

You can also set environment variables using Vercel CLI:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Set environment variable
vercel env add VITE_API_URL
# Enter your backend URL when prompted
# Select environments (production, preview, development)
```

### 5. Troubleshooting

If environment variables still don't work:

1. **Check the browser console** - you should see debug logs showing the environment variables
2. **Verify the variable name** - it must start with `VITE_`
3. **Redeploy after setting** - Environment variables require a new deployment
4. **Check Vercel logs** - Look for build errors in the Vercel deployment logs

### 6. After Setting Variables

1. Go to your Vercel dashboard
2. Go to **Deployments** tab
3. Click **Redeploy** on your latest deployment (or push a new commit)
4. The new deployment will include your environment variables

### 7. Verification

After deployment, check the browser console. You should see logs like:
```
Environment variables debug:
VITE_API_URL: https://your-backend.com/api
Final API_BASE_URL: https://your-backend.com/api
```

## Security Note

Remember that `VITE_*` environment variables are **publicly accessible** in the browser. Never put sensitive information like API keys, secrets, or passwords in frontend environment variables.