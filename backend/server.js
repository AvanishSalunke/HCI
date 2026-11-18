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
const pushRoutes = require('./routes/push');

// Fail early with a clear message instead of a confusing error later.
for (const name of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`Missing ${name}. Set it in backend/.env (or the Render Environment tab).`);
    process.exit(1);
  }
}

const app = express();
// Render sits behind a proxy; this makes req.ip the real visitor address.
app.set('trust proxy', 1);
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
app.use('/api/push', pushRoutes);
// Which version of the code is running. The deploy check on GitHub reads this.
app.get('/api/version', (req, res) => {
  res.json({ commit: process.env.RENDER_GIT_COMMIT || 'unknown' });
});
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the VJTI Fund Tracker API!' });
});

// Unknown address
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Anything that goes wrong is answered in the same JSON shape the website expects.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'This website is not allowed to use the API' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'That upload is too large' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request could not be read' });
  }
  console.error(err);
  res.status(500).json({ message: 'Server Error' });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Render stops the service with SIGTERM on every deploy; close cleanly.
process.on('SIGTERM', () => {
  server.close(() => mongoose.connection.close(false).finally(() => process.exit(0)));
});
