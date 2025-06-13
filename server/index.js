const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const corsConfig = require('./middlewares/corsConfig');
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // Or your frontend URL
    methods: ['GET', 'POST','PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  },
});

const PORT = process.env.PORT || 5000;

// Models
require('./models/User');
require('./models/Interview');
require('./models/CandidateProfile');
require('./models/InterviewReport');
require('./models/Notification');

// Middlewares
app.use(corsConfig);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidate', require('./routes/candidate'));
app.use('/api/interviewer', require('./routes/interviewer'));

// DB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB error:', err));
  
const roomUsers = {};

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // Notification join
  socket.on('join', (userId) => {
    console.log(`🔔 User ${userId} joined room ${userId}`);
    socket.join(userId);
  });
  
// Chat messaging
socket.on('chat-message', ({ roomId, message, from }) => {
  console.log(`💬 Message from ${from} in room ${roomId}: ${message}`);
  socket.to(roomId).emit('chat-message', { from, message });
});
 socket.on('tab-switch', ({ roomId, from }) => {
  socket.to(roomId).emit('candidate-tab-switch', { from });
});

  // Interview join
  socket.on('join-room', ({ roomId, userId }) => {
    socket.join(roomId);

    // Track users in the room
    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    roomUsers[roomId].push({ userId, socketId: socket.id });

    // Send updated users to the newly joined user
    socket.emit('users-in-room', roomUsers[roomId].filter(u => u.socketId !== socket.id));

    // Notify others
    socket.to(roomId).emit('user-ready', { userId, socketId: socket.id });
  });


  // WebRTC signaling
  socket.on('offer', ({ offer, to }) => {
    console.log(`📨 Offer from ${socket.id} to ${to}`);
    socket.to(to).emit('offer', { offer, from: socket.id });
  });
  
  socket.on('answer', ({ answer, to }) => {
    console.log(`📨 Answer from ${socket.id} to ${to}`);
    socket.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    console.log(`📨 ICE candidate from ${socket.id} to ${to}`);
    socket.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('❌ A user disconnected:', socket.id);
    for (const roomId in roomUsers) {
      roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
      // Optional: notify others
      socket.to(roomId).emit('user-disconnected', { socketId: socket.id });
    }
  });
});

// Make io accessible in routes
app.set('io', io);
