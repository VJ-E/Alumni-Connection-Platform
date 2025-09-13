const { io } = require('socket.io-client');
const mongoose = require('mongoose');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const SOCKET_PATH = '/api/socket';

// Test users
const user1 = {
  id: 'test_user_1',
  name: 'Test User 1'
};

const user2 = {
  id: 'test_user_2', 
  name: 'Test User 2'
};

// Test group
const testGroup = {
  id: new mongoose.Types.ObjectId().toString(),
  name: 'Test Group',
  members: [user1.id, user2.id]
};

async function testDirectMessages() {
  console.log('\n🧪 Testing Direct Messages...');
  
  return new Promise((resolve) => {
    const socket1 = io(SERVER_URL, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling']
    });
    
    const socket2 = io(SERVER_URL, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling']
    });
    
    let messagesReceived = 0;
    const expectedMessages = 2;
    
    socket1.on('connect', () => {
      console.log('✅ User 1 connected:', socket1.id);
      socket1.emit('join', user1.id);
      
      socket2.on('connect', () => {
        console.log('✅ User 2 connected:', socket2.id);
        socket2.emit('join', user2.id);
        
        // Wait a moment for both to join
        setTimeout(() => {
          console.log('📤 Sending test message from User 1 to User 2...');
          socket1.emit('sendMessage', {
            senderId: user1.id,
            receiverId: user2.id,
            content: 'Hello from User 1!',
            imageUrl: null
          });
        }, 1000);
      });
    });
    
    socket1.on('messageConfirmed', (message) => {
      console.log('✅ User 1 received confirmation:', message.content);
      messagesReceived++;
      if (messagesReceived >= expectedMessages) {
        console.log('✅ Direct Messages test completed successfully!');
        socket1.disconnect();
        socket2.disconnect();
        resolve(true);
      }
    });
    
    socket2.on('newMessage', (message) => {
      console.log('✅ User 2 received message:', message.content);
      messagesReceived++;
      
      // Send a reply
      setTimeout(() => {
        socket2.emit('sendMessage', {
          senderId: user2.id,
          receiverId: user1.id,
          content: 'Hello back from User 2!',
          imageUrl: null
        });
      }, 500);
    });
    
    socket2.on('messageConfirmed', (message) => {
      console.log('✅ User 2 received confirmation:', message.content);
      messagesReceived++;
      if (messagesReceived >= expectedMessages) {
        console.log('✅ Direct Messages test completed successfully!');
        socket1.disconnect();
        socket2.disconnect();
        resolve(true);
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('❌ Direct Messages test timed out');
      socket1.disconnect();
      socket2.disconnect();
      resolve(false);
    }, 10000);
  });
}

async function testGroupChat() {
  console.log('\n🧪 Testing Group Chat...');
  
  return new Promise((resolve) => {
    const socket1 = io(SERVER_URL, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling']
    });
    
    const socket2 = io(SERVER_URL, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling']
    });
    
    let messagesReceived = 0;
    const expectedMessages = 2;
    
    socket1.on('connect', () => {
      console.log('✅ User 1 connected for group chat:', socket1.id);
      socket1.emit('join', user1.id);
      socket1.emit('joinGroup', testGroup.id);
      
      socket2.on('connect', () => {
        console.log('✅ User 2 connected for group chat:', socket2.id);
        socket2.emit('join', user2.id);
        socket2.emit('joinGroup', testGroup.id);
        
        // Wait a moment for both to join
        setTimeout(() => {
          console.log('📤 Sending test group message from User 1...');
          socket1.emit('sendGroupMessage', {
            groupId: testGroup.id,
            senderId: user1.id,
            content: 'Hello everyone in the group!',
            imageUrl: null
          });
        }, 1000);
      });
    });
    
    socket1.on('groupMessageConfirmed', (message) => {
      console.log('✅ User 1 received group message confirmation:', message.content);
      messagesReceived++;
      if (messagesReceived >= expectedMessages) {
        console.log('✅ Group Chat test completed successfully!');
        socket1.disconnect();
        socket2.disconnect();
        resolve(true);
      }
    });
    
    socket2.on('newGroupMessage', (message) => {
      console.log('✅ User 2 received group message:', message.content);
      messagesReceived++;
      
      // Send a reply
      setTimeout(() => {
        socket2.emit('sendGroupMessage', {
          groupId: testGroup.id,
          senderId: user2.id,
          content: 'Hello back to the group!',
          imageUrl: null
        });
      }, 500);
    });
    
    socket2.on('groupMessageConfirmed', (message) => {
      console.log('✅ User 2 received group message confirmation:', message.content);
      messagesReceived++;
      if (messagesReceived >= expectedMessages) {
        console.log('✅ Group Chat test completed successfully!');
        socket1.disconnect();
        socket2.disconnect();
        resolve(true);
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('❌ Group Chat test timed out');
      socket1.disconnect();
      socket2.disconnect();
      resolve(false);
    }, 10000);
  });
}

async function testTypingIndicators() {
  console.log('\n🧪 Testing Typing Indicators...');
  
  return new Promise((resolve) => {
    const socket1 = io(SERVER_URL, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling']
    });
    
    const socket2 = io(SERVER_URL, {
      path: SOCKET_PATH,
      transports: ['websocket', 'polling']
    });
    
    let typingReceived = false;
    
    socket1.on('connect', () => {
      console.log('✅ User 1 connected for typing test:', socket1.id);
      socket1.emit('join', user1.id);
      
      socket2.on('connect', () => {
        console.log('✅ User 2 connected for typing test:', socket2.id);
        socket2.emit('join', user2.id);
        
        // Wait a moment for both to join
        setTimeout(() => {
          console.log('📤 Sending typing indicator from User 1...');
          socket1.emit('typing', {
            senderId: user1.id,
            receiverId: user2.id,
            isTyping: true
          });
        }, 1000);
      });
    });
    
    socket2.on('userTyping', (data) => {
      console.log('✅ User 2 received typing indicator:', data);
      typingReceived = true;
      
      // Stop typing after 2 seconds
      setTimeout(() => {
        socket1.emit('typing', {
          senderId: user1.id,
          receiverId: user2.id,
          isTyping: false
        });
        
        setTimeout(() => {
          console.log('✅ Typing Indicators test completed successfully!');
          socket1.disconnect();
          socket2.disconnect();
          resolve(true);
        }, 500);
      }, 2000);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('❌ Typing Indicators test timed out');
      socket1.disconnect();
      socket2.disconnect();
      resolve(false);
    }, 10000);
  });
}

async function runAllTests() {
  console.log('🚀 Starting Socket.IO Integration Tests...');
  console.log(`📍 Server URL: ${SERVER_URL}`);
  console.log(`📍 Socket Path: ${SOCKET_PATH}`);
  
  try {
    // Test direct messages
    const dmResult = await testDirectMessages();
    
    // Test group chat
    const groupResult = await testGroupChat();
    
    // Test typing indicators
    const typingResult = await testTypingIndicators();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Direct Messages: ${dmResult ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Group Chat: ${groupResult ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Typing Indicators: ${typingResult ? 'PASSED' : 'FAILED'}`);
    
    const allPassed = dmResult && groupResult && typingResult;
    console.log(`\n🎯 Overall Result: ${allPassed ? 'ALL TESTS PASSED! ✅' : 'SOME TESTS FAILED! ❌'}`);
    
    if (allPassed) {
      console.log('\n🚀 Socket.IO integration is ready for Railway deployment!');
    } else {
      console.log('\n⚠️  Please fix the failing tests before deployment.');
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testDirectMessages,
  testGroupChat,
  testTypingIndicators,
  runAllTests
};
