const Transaction = require('../models/Transaction');
const Fund = require('../models/Fund');
const { notify } = require('../utils/notify');
// 
// Turns a mongoose validation problem into a readable 400 instead of "Server Error".
const sendError = (res, error) => {
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(e => e.message).join('. ');
    return res.status(400).json({ message });
  }
  if (error.name === 'CastError') {
    return res.status(404).json({ message: 'Transaction not found' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Server Error' });
};

const createTransaction = async (req, res) => {
  try {
    const { title, amount, category, description, receiptLink } = req.body;
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ message: 'Please enter an amount greater than zero' });
    }
    const transaction = new Transaction({
      title: typeof title === 'string' ? title.trim() : title,
      amount: value,
      category,
      description,
      receiptLink: typeof receiptLink === 'string' ? receiptLink.trim() : receiptLink,
      user: req.user._id,
      committee: req.user.committee,
    });
    const createdTransaction = await transaction.save();
    notify({ role: 'teacher', committee: req.user.committee }, {
      title: 'New expense to review',
      body: `${req.user.username}: ${createdTransaction.title} (₹${createdTransaction.amount.toLocaleString('en-IN')})`,
      url: '/teacher-dashboard',
      tag: `expense-${createdTransaction._id}`,
    });
    res.status(201).json(createdTransaction);
  } catch (error) { sendError(res, error); }
};
const getStudentTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) { sendError(res, error); }
};
const getCommitteeTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ committee: req.user.committee })
      .sort({ createdAt: -1 })
      .populate('user', 'username');
    res.json(transactions);
  } catch (error) { sendError(res, error); }
};
const updateTransactionStatus = async (req, res) => {
  try {
    const { status, rejectionReason, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    const existing = await Transaction.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    if (existing.committee !== req.user.committee) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    // Only a pending request can be decided, and only once. The status check is
    // part of the update itself, so a double click cannot count the amount twice.
    const update = { status };
    if (status === 'rejected' && rejectionReason) update.rejectionReason = rejectionReason;
    if (status === 'approved' && typeof adminNote === 'string' && adminNote.trim()) {
      update.adminNote = adminNote.trim().slice(0, 1000);
    }
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: existing._id, status: 'pending' },
      update,
      { new: true, runValidators: true }
    );
    if (!updatedTransaction) {
      return res.status(400).json({ message: 'This expense has already been reviewed' });
    }
    if (status === 'approved') {
      await Fund.findOrCreate(req.user.committee);
      await Fund.updateOne(
        { committee: req.user.committee },
        { $inc: { totalExpenses: updatedTransaction.amount } }
      );
    }
    const approved = status === 'approved';
    notify({ user: updatedTransaction.user }, {
      title: approved ? 'Expense approved' : 'Expense rejected',
      body: approved ? updatedTransaction.title : `${updatedTransaction.title}${rejectionReason ? `: ${rejectionReason}` : ''}`,
      url: '/student-dashboard',
      tag: `expense-${updatedTransaction._id}`,
    });
    if (approved) {
      notify({ role: 'admin' }, {
        title: updatedTransaction.adminNote ? 'Expense approved (with a note)' : 'Expense approved',
        body: `${updatedTransaction.title} · ₹${updatedTransaction.amount.toLocaleString('en-IN')}`,
        url: '/admin-dashboard',
        tag: `approval-${updatedTransaction._id}`,
      });
    }
    res.json(updatedTransaction);
  } catch (error) { sendError(res, error); }
};
module.exports = {
  createTransaction,
  getStudentTransactions,
  getCommitteeTransactions,
  updateTransactionStatus,
};
