# Real-time Messaging with Socket.IO

This document provides an overview of the real-time messaging feature implementation using Socket.IO in the Alumni Connection Platform.

## Architecture

```
Frontend (Next.js on Vercel)
       ↕
  Socket.IO Client
       ↔
Realtime Backend (Socket.IO on Render.com/Railway)
       ↔
MongoDB Atlas (messages stored for history)
```

## Features

- Real-time message delivery
- Typing indicators
- Message read receipts
- Online/offline status
- Message persistence in MongoDB
- Image sharing support

## Setup Instructions

### Backend Setup

1. Navigate to the `realtime-backend` directory:
   ```bash
   cd realtime-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the example:
   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env`:
   ```
   MONGODB_URI=your_mongodb_connection_string
   FRONTEND_URL=http://localhost:3000
   PORT=3001
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Create a `.env.local` file in the root directory:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update the environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   # Other required environment variables...
   ```

3. Install the required dependencies:
   ```bash
   npm install socket.io-client @types/socket.io-client
   ```

## Testing the Real-time Features

### Manual Testing

1. Open the application in two different browsers or incognito windows
2. Log in with two different user accounts
3. Navigate to the messaging interface
4. Test the following:
   - Sending and receiving messages in real-time
   - Typing indicators
   - Online/offline status
   - Image sharing

### Automated Testing

Run the test script to verify the real-time functionality:

```bash
node scripts/test-realtime.js
```

## Deployment

### Backend Deployment

1. Push the code to your GitHub repository
2. Deploy to Render.com or Railway:
   - Connect your GitHub repository
   - Set the environment variables
   - Deploy the application

### Frontend Deployment

1. Update the `NEXT_PUBLIC_SOCKET_URL` in your production environment variables
2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## Troubleshooting

### Common Issues

1. **Connection Issues**:
   - Verify the Socket.IO server is running
   - Check CORS settings on the server
   - Ensure the client is connecting to the correct URL

2. **Messages Not Sending**:
   - Check the browser console for errors
   - Verify the MongoDB connection
   - Ensure users are connected before messaging

3. **Typing Indicators Not Working**:
   - Verify the socket events are being emitted and received
   - Check for network issues

## Performance Considerations

- The application uses socket rooms to only send messages to relevant users
- Messages are stored in MongoDB for persistence
- The frontend implements optimistic UI updates for a better user experience
- Consider implementing message pagination for large chat histories

## Security Considerations

- All socket events are authenticated using the user's session
- Messages are only delivered to intended recipients
- Input validation is performed on both client and server
- Sensitive operations require proper authentication
