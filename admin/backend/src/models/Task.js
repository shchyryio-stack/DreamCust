const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  department: { type: String, enum: ['IT', 'Call Center', 'Warehouse', 'Management', 'Marketing', 'Support', 'All'] },
  taskType: { type: String, enum: ['Bug', 'Technical Issue', 'Client Request', 'Urgent', 'System', 'Warehouse', 'Call Center', 'Management', 'Marketing', 'Support', 'Other'] },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical', 'Emergency'], default: 'Medium' },
  status: { type: String, enum: ['Pending', 'In Progress', 'Review', 'Completed', 'Rejected', 'Closed', 'Overdue', 'Deferred'], default: 'Pending' },
  deadline: { type: Date, required: true },
  assignmentMode: { type: String, enum: ['Personal', 'Department', 'Global'], default: 'Personal' },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  isArchived: { type: Boolean, default: false },
  activity: [{
    action: String,
    details: String,
    date: { type: Date, default: Date.now }
  }],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema, 'tasks');
