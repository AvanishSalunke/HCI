const Message = require('../models/Message');

const MAX_MESSAGE_LENGTH = 1000;

const getMessages = async (req, res) => {
  try {
    const { committee } = req.user;
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
    const { _id: sender, committee } = req.user;
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
