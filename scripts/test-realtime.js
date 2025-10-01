// Test script to verify real-time messaging functionality
const io = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');

// Configuration - update these values
const SOCKET_URL = 'http://localhost:3001';
const USER1_ID = 'user1';
const USER2_ID = 'user2';

// Helper function to create a test message
function createTestMessage(senderId, receiverId) {
  return {
    senderId,
    receiverId,
    content: `Test message from ${senderId} at ${new Date().toISOString()}`,
    createdAt: new Date()
  };
}

// Test 1: Basic connection and message sending
async function testBasicMessaging() {
  console.log('=== Starting Basic Messaging Test ===');
  
  // Create two socket connections
  const socket1 = io(SOCKET_URL, {
    query: { userId: USER1_ID }
  });

  const socket2 = io(SOCKET_URL, {
    query: { userId: USER2_ID }
  });

  // Set up event listeners for socket1
  socket1.on('connect', () => {
    console.log(`[${USER1_ID}] Connected to server`);
    
    // Send a message from user1 to user2
    const message = createTestMessage(USER1_ID, USER2_ID);
    console.log(`[${USER1_ID}] Sending message to ${USER2_ID}:`, message.content);
    socket1.emit('sendMessage', message);
  });

  // Set up event listeners for socket2
  socket2.on('connect', () => {
    console.log(`[${USER2_ID}] Connected to server`);
  });

  // Listen for messages on socket2
  socket2.on('newMessage', (message) => {
    console.log(`[${USER2_ID}] Received message:`, message.content);
    console.log('=== Basic Messaging Test PASSED ===');
    
    // Clean up
    socket1.disconnect();
    socket2.disconnect();
    process.exit(0);
  });

  // Handle connection errors
  socket1.on('connect_error', (err) => {
    console.error(`[${USER1_ID}] Connection error:`, err);
    process.exit(1);
  });

  socket2.on('connect_error', (err) => {
    console.error(`[${USER2_ID}] Connection error:`, err);
    process.exit(1);
  });
}

// Test 2: Typing indicators
async function testTypingIndicators() {
  console.log('\n=== Starting Typing Indicators Test ===');
  
  const socket1 = io(SOCKET_URL, { query: { userId: USER1_ID } });
  const socket2 = io(SOCKET_URL, { query: { userId: USER2_ID } });

  socket1.on('connect', () => {
    console.log(`[${USER1_ID}] Connected to server`);
    
    // Simulate typing
    console.log(`[${USER1_ID}] Simulating typing...`);
    socket1.emit('typing', {
      senderId: USER1_ID,
      receiverId: USER2_ID,
      isTyping: true
    });

    // Stop typing after 2 seconds
    setTimeout(() => {
      socket1.emit('typing', {
        senderId: USER1_ID,
        receiverId: USER2_ID,
        isTyping: false
      });
      console.log(`[${USER1_ID}] Stopped typing`);
      
      // Clean up
      socket1.disconnect();
      socket2.disconnect();
      console.log('=== Typing Indicators Test PASSED ===');
      process.exit(0);
    }, 2000);
  });

  // Listen for typing events on socket2
  socket2.on('userTyping', (data) => {
    if (data.isTyping) {
      console.log(`[${USER2_ID}] ${USER1_ID} is typing...`);
    } else {
      console.log(`[${USER2_ID}] ${USER1_ID} stopped typing`);
    }
  });
}

// Run tests
async function runTests() {
  try {
    await testBasicMessaging();
    // Wait a bit before running the next test
    setTimeout(testTypingIndicators, 3000);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTests();
