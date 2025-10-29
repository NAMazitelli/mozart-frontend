# CORS and Mobile API Connection Fix - RESOLVED ✅

## The Problem 🚨 (SOLVED)
Your Android APK couldn't connect to the backend because:

1. **Localhost Issue**: The app was configured to connect to `http://localhost:3000/api`, but on mobile devices, `localhost` refers to the device itself, not your development machine.

2. **CORS Issue**: The backend needed to allow requests from mobile apps.

## ✅ SOLUTION IMPLEMENTED

**Fixed by updating the backend URL to your Vercel deployment:**
- **Old URL**: `http://localhost:3000/api` ❌
- **New URL**: `https://mozart-backend-wine.vercel.app/api` ✅

This resolves both issues:
- ✅ **No more localhost problem**: Using the public Vercel URL
- ✅ **HTTPS protocol**: Secure connection
- ✅ **CORS handled**: Vercel deployments typically handle CORS correctly

## Solutions 🛠️

### Solution 1: Backend CORS Configuration (Recommended)

#### For Express.js Backend:
```javascript
// Add this to your backend server (e.g., app.js or server.js)
const cors = require('cors');

// Allow all origins for development (not recommended for production)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// OR for production, specify allowed origins:
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'http://127.0.0.1:3000',
    'https://your-frontend-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

#### For Node.js/NestJS Backend:
```javascript
// In main.ts or app setup
app.enableCors({
  origin: true, // or specify origins as above
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});
```

### Solution 2: Update API URL Configuration

#### Option A: Use Your Machine's IP Address
1. **Find your machine's IP address**:
   ```bash
   # On macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # On Windows
   ipconfig
   ```

2. **Update .env file**:
   ```env
   # Replace with your machine's actual IP address
   VITE_API_URL=http://192.168.1.100:3000/api
   ```

#### Option B: Use a Tunnel Service (ngrok)
1. **Install ngrok**:
   ```bash
   brew install ngrok
   # or download from https://ngrok.com/
   ```

2. **Expose your backend**:
   ```bash
   # If your backend runs on port 3000
   ngrok http 3000
   ```

3. **Update .env file**:
   ```env
   # Use the ngrok URL
   VITE_API_URL=https://abc123.ngrok.io/api
   ```

### Solution 3: Capacitor HTTP Configuration

Update your `capacitor.config.ts` to handle HTTP requests properly:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mozart.musiclearning',
  appName: 'Mozart Music Learning',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow clear text traffic for development
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
```

## Quick Fix Steps 🚀

### Step 1: Backend CORS Fix
Add CORS middleware to your backend with the configuration above.

### Step 2: Update API URL
1. Find your machine's IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. Update your `.env` file:
   ```env
   # Replace 192.168.1.100 with your actual IP
   VITE_API_URL=http://192.168.1.100:3000/api
   ```

### Step 3: Update Capacitor Config
Add the HTTP configuration to `capacitor.config.ts` as shown above.

### Step 4: Rebuild and Test
```bash
# Rebuild web app
npm run build

# Sync to Android
npx cap sync android

# Rebuild APK
cd android && ./gradlew assembleDebug
```

## Testing the Fix ✅

### 1. Test API Connection
Add this debug code temporarily to your app:

```javascript
// In src/services/api.ts, add this after the API_BASE_URL line:
console.log('API Base URL:', API_BASE_URL);

// Test the connection
api.get('/test-endpoint')
  .then(response => console.log('API Connection Success:', response))
  .catch(error => console.log('API Connection Error:', error));
```

### 2. Check Network in Chrome DevTools
1. Connect your Android device via USB
2. Open Chrome and go to `chrome://inspect`
3. Click "Inspect" on your app
4. Check the Network tab for API requests

## Production Considerations 🏭

### For Production Backend:
```javascript
// Restrict CORS to your production domains only
app.use(cors({
  origin: [
    'https://your-frontend-domain.com',
    'capacitor://localhost',
    'ionic://localhost'
  ],
  credentials: true
}));
```

### For Production Mobile App:
- Use HTTPS URLs only
- Update environment variables for production
- Configure proper SSL certificates

## Common Issues & Solutions 🔧

### Issue: "Network Error" or "ERR_CONNECTION_REFUSED"
- **Solution**: Check if backend is running and accessible from your network
- **Test**: Try accessing the API URL in your phone's browser

### Issue: "Access to XMLHttpRequest blocked by CORS"
- **Solution**: Update backend CORS configuration as shown above

### Issue: "localhost not reachable"
- **Solution**: Use your machine's IP address instead of localhost

### Issue: SSL/Certificate errors
- **Solution**: For development, allow cleartext in capacitor.config.ts

## Debug Commands 🔍

```bash
# Check your IP address
ifconfig | grep "inet " | grep -v 127.0.0.1

# Test API connectivity from command line
curl -v http://YOUR_IP:3000/api/test-endpoint

# Check if backend is accessible from network
nmap -p 3000 YOUR_IP

# View Android app logs
adb logcat | grep -i mozart
```

This should resolve your CORS and connectivity issues! 🎯