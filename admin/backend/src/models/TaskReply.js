const mongoose = require('mongoose');

const taskReplySchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  content: { type: String, required: true },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
}, { timestamps: true });

module.exports = mongoose.model('TaskReply', taskReplySchema, 'taskReplies');
