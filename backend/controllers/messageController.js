const Message = require('../models/Message');
const committees = require('../committees');
const { notify } = require('../utils/notify');

const MAX_MESSAGE_LENGTH = 1000;

// Students and teachers always use their own committee. The admin picks one.
const roomFor = (req, requested) => {
  if (req.user.role !== 'admin') return req.user.committee;
  return committees.some(c => c.id === requested) ? requested : null;
};

const getMessages = async (req, res) => {
  try {
    const committee = roomFor(req, req.query.committee);
    if (!committee) return res.status(400).json({ message: 'Choose a committee' });
    const messages = await Message.find({ committee })
      .populate('sender', 'username role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { _id: sender } = req.user;
    const committee = roomFor(req, req.body.committee);
    if (!committee) return res.status(400).json({ message: 'Choose a committee' });
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';

    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Messages can be at most ${MAX_MESSAGE_LENGTH} characters` });
    }

    const newMessage = await Message.create({
      sender,
      committee,
      text,
    });

    await newMessage.populate('sender', 'username role');

    // Emit event to room
    if (req.io) {
      req.io.to(committee).emit('receive_message', newMessage);
    }

    const senderName = req.user.role === 'admin' ? 'Admin' : req.user.username;
    notify({ committee, role: { $in: ['student', 'teacher'] }, user: { $ne: sender } }, {
      title: `${senderName} in committee chat`,
      body: text.length > 120 ? `${text.slice(0, 117)}...` : text,
      url: req.user.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard',
      tag: `chat-${committee}`,
    });
    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
};
