const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

dotenv.config();

if (process.env.DNS_SERVERS) {
  require('dns').setServers(process.env.DNS_SERVERS.split(',').map(s => s.trim()));
}

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const sponsorshipRoutes = require('./routes/sponsorships');
const fundRoutes = require('./routes/funds');
const announcementRoutes = require('./routes/announcements');
const messageRoutes = require('./routes/messages');
const eventRoutes = require('./routes/events');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Chat sockets must carry a valid login token.
io.use(async (socket, next) => {
  try {
    const decoded = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('committee role');
    if (!user) return next(new Error('Not authorized'));
    socket.data.committee = user.committee;
    socket.data.role = user.role;
    next();
  } catch (err) {
    next(new Error('Not authorized'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Students and faculty can only ever join their own committee's room.
  // The admin may join the room of any committee they are looking at.
  socket.on('join_committee', (requested) => {
    const room = socket.data.role === 'admin' && typeof requested === 'string'
      ? requested
      : socket.data.committee;
    socket.join(room);
    console.log(`Socket ${socket.id} joined committee room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
connectDB();

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // event posters arrive as base64
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/sponsorships', sponsorshipRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the VJTI Fund Tracker API!' });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
