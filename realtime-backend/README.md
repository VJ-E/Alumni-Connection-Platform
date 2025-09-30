# Alumni Connection Platform - Realtime Backend

This is the real-time messaging backend for the Alumni Connection Platform, built with Socket.IO and Node.js.

## Prerequisites

- Node.js 18+
- MongoDB Atlas database
- Render.com account (for deployment)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Update the environment variables with your configuration

## Running Locally

```bash
# Development
npm run dev

# Production
npm start
```

## Deployment to Render.com

1. Push your code to a GitHub repository
2. Create a new Web Service on Render.com
3. Connect your GitHub repository
4. Set up environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NODE_ENV`: production
   - `FRONTEND_URL`: Your frontend URL (e.g., https://your-frontend.vercel.app)
5. Deploy!

## API Endpoints

- `GET /health` - Health check
- `GET /active-users` - Get active users

## Socket.IO Events

### Client Events
- `join` - Join the chat with user ID
- `sendMessage` - Send a message
- `typing` - Notify when user is typing

### Server Events
- `newMessage` - Receive a new message
- `messageConfirmed` - Message delivery confirmation
- `userTyping` - Notify when a user is typing
- `messageError` - Error sending message
