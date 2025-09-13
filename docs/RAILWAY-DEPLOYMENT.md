# Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **MongoDB Database**: Either use Railway's MongoDB service or MongoDB Atlas
3. **Environment Variables**: Gather all required environment variables

## Deployment Steps

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `Alumni-Connection-Platform`
5. Railway will automatically detect the project type

### 2. Configure Environment Variables

In Railway Dashboard, go to your project → Variables tab and add:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alumni-platform
# Note: Railway may also set MONGO_URI, both are supported

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Railway automatically sets these:
# RAILWAY_PUBLIC_DOMAIN=your-app-name.railway.app
# PORT=3000
# NODE_ENV=production
```

### 3. Database Setup

#### Option A: Railway MongoDB (Recommended)
1. In Railway Dashboard, click "New Service"
2. Select "Database" → "MongoDB"
3. Railway will automatically provide the connection string
4. Copy the connection string to `MONGODB_URI`

#### Option B: MongoDB Atlas
1. Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Get the connection string
3. Add it to `MONGODB_URI`

### 4. Deploy

Railway will automatically:
1. Install dependencies (`npm install`)
2. Build the application (`npm run build`)
3. Start the server (`npm run start`)

### 5. Configure Custom Domain (Optional)

1. In Railway Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Clerk configuration with new domain

## Application Architecture

### Socket.IO Integration
- **Single Server**: Next.js app with integrated Socket.IO server
- **Path**: `/api/socket` for WebSocket connections
- **CORS**: Automatically configured for production domains
- **Features**: Real-time messaging, group chat, typing indicators

### Environment Detection
The application automatically detects:
- **Development**: `http://localhost:3000`
- **Production**: Railway domain or Vercel domain
- **Socket.IO**: Connects to same domain with `/api/socket` path

## Verification

After deployment, verify:

1. **Application loads**: Visit your Railway domain
2. **Socket.IO works**: Check browser console for successful connections
3. **Authentication**: Test sign-in/sign-up
4. **Messaging**: Test both DMs and group chat
5. **Image uploads**: Test image sharing in chat

## Troubleshooting

### Common Issues

1. **Socket.IO Connection Failed**
   - Check browser console for errors
   - Verify CORS configuration in production
   - Ensure `/api/socket` endpoint is accessible

2. **MongoDB Connection Issues**
   - Verify `MONGODB_URI` is correctly set
   - Check MongoDB cluster accessibility
   - Ensure proper network access rules

3. **Authentication Issues**
   - Verify Clerk environment variables
   - Update Clerk app settings with production domain
   - Check CORS settings in Clerk dashboard

4. **Image Upload Issues**
   - Verify Cloudinary configuration
   - Check file size limits (5MB max)
   - Ensure proper CORS for image uploads

### Logs and Monitoring

Railway provides:
- **Build Logs**: Check build process
- **Runtime Logs**: Monitor application behavior
- **Metrics**: CPU, memory, and network usage

## Scaling

Railway automatically handles:
- **Horizontal Scaling**: Multiple instances
- **Load Balancing**: Traffic distribution
- **Health Checks**: Automatic restart on failure

## Security

- **Environment Variables**: Securely stored in Railway
- **HTTPS**: Automatically enabled
- **CORS**: Properly configured for production
- **Authentication**: Clerk handles security
- **Database**: MongoDB with proper access controls

## Cost Optimization

- **Free Tier**: 500 hours/month
- **Usage-Based**: Pay only for what you use
- **Automatic Scaling**: Scale down when not in use
- **Database**: Shared MongoDB instances available

## Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Community**: Railway Discord
- **Status**: [status.railway.app](https://status.railway.app)
