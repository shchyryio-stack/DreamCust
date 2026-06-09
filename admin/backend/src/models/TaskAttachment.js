const mongoose = require('mongoose');

const taskAttachmentSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  replyId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskReply' },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  filename: { type: String, required: true },
  url: { type: String, required: true },
  fileSize: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('TaskAttachment', taskAttachmentSchema, 'taskAttachments');
