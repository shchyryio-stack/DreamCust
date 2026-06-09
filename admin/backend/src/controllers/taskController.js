const Task = require('../models/Task');
const TaskReply = require('../models/TaskReply');
const TaskAttachment = require('../models/TaskAttachment');
const Employee = require('../models/Employee');

const getSortScore = (task, employee) => {
  let score = 0;
  
  const isPersonal = task.assignees && task.assignees.some(a => a._id.toString() === employee._id.toString());
  const isDepartment = task.assignmentMode === 'Department' && task.department === employee.department;
  const isGlobal = task.assignmentMode === 'Global';

  // Assignment Type Score
  let assignScore = 0;
  if (isPersonal) assignScore = 3;
  else if (isDepartment) assignScore = 2;
  else if (isGlobal) assignScore = 1;

  // Base Priority Score
  const priorityScores = {
    'Emergency': 50,
    'Critical': 40,
    'High': 30,
    'Medium': 20,
    'Low': 10
  };

  const basePrio = priorityScores[task.priority] || 20;

  if (task.deadline) {
    const timeRemaining = new Date(task.deadline).getTime() - Date.now();
    const hoursRemaining = timeRemaining / (1000 * 60 * 60);
    
    if (hoursRemaining <= 0 && task.status !== 'Completed' && task.status !== 'Closed' && task.status !== 'Deferred') {
      // Overdue
      return 2000 + assignScore;
    } else if (hoursRemaining <= 24 && hoursRemaining > 0 && task.status !== 'Completed' && task.status !== 'Closed' && task.status !== 'Deferred') {
      // Expiring soon
      return 1000 + assignScore;
    }
  }

  return (basePrio * 10) + assignScore;
};

// Auto-archive helper
const handleAutoArchive = async (tasks) => {
  const now = Date.now();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  
  for (const t of tasks) {
    if (!t.isArchived && (t.status === 'Completed' || t.status === 'Closed')) {
      const updatedAtMs = new Date(t.updatedAt).getTime();
      if (now - updatedAtMs > fourteenDaysMs) {
        await Task.updateOne({ _id: t._id }, { $set: { isArchived: true } });
        t.isArchived = true;
      }
    }
  }
};

const getTasks = async (req, res) => {
  try {
    const employee = req.employee;
    let tasks = await Task.find({ isArchived: false })
      .populate('assignees', 'fullName avatar position')
      .populate('creator', 'fullName avatar')
      .lean();

    await handleAutoArchive(tasks);
    tasks = tasks.filter(t => !t.isArchived); // Filter out newly archived

    // Received tasks: assigned directly, or to my department, or global
    const receivedTasks = tasks.filter(t => {
      const isPersonal = t.assignees.some(a => a._id.toString() === employee._id.toString());
      const isDept = t.assignmentMode === 'Department' && t.department === employee.department;
      const isGlobal = t.assignmentMode === 'Global';
      return isPersonal || isDept || isGlobal;
    });

    receivedTasks.sort((a, b) => getSortScore(b, employee) - getSortScore(a, employee));

    res.json(receivedTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCreatedTasks = async (req, res) => {
  try {
    const employee = req.employee;
    const tasks = await Task.find({ creator: employee._id, isArchived: false })
      .populate('assignees', 'fullName avatar position')
      .populate('creator', 'fullName avatar')
      .lean();

    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getArchivedTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ isArchived: true })
      .populate('assignees', 'fullName avatar position')
      .populate('creator', 'fullName avatar')
      .sort({ updatedAt: -1 })
      .lean();

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'fullName avatar position')
      .populate('creator', 'fullName avatar')
      .lean();

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const replies = await TaskReply.find({ taskId: task._id })
      .populate('authorId', 'fullName avatar position')
      .sort({ createdAt: 1 })
      .lean();
      
    const attachments = await TaskAttachment.find({ taskId: task._id }).lean();

    res.json({ ...task, replies, attachments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const task = new Task({
      ...req.body,
      creator: req.employee._id,
      activity: [{ action: 'Created', details: 'Task was created', date: new Date() }]
    });
    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Track changes
    const changes = [];
    if (req.body.status && req.body.status !== task.status) {
      changes.push({ action: 'Status Changed', details: `Status changed to ${req.body.status}` });
    }

    Object.assign(task, req.body);
    if (changes.length > 0) {
      task.activity.push(...changes.map(c => ({ ...c, date: new Date() })));
    }
    
    const updatedTask = await task.save();
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const replyToTask = async (req, res) => {
  try {
    const reply = new TaskReply({
      taskId: req.params.id,
      authorId: req.employee._id,
      content: req.body.content
    });
    const savedReply = await reply.save();
    
    const task = await Task.findById(req.params.id);
    if (task) {
      task.activity.push({ action: 'Reply Added', details: `${req.employee.fullName} added a reply.`, date: new Date() });
      await task.save();
    }
    
    const populatedReply = await TaskReply.findById(savedReply._id).populate('authorId', 'fullName avatar position');
    res.status(201).json(populatedReply);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const uploadAttachment = async (req, res) => {
  try {
    const attachment = new TaskAttachment({
      taskId: req.params.id,
      uploaderId: req.employee._id,
      filename: req.body.filename || 'uploaded_file',
      url: req.body.url || '/placeholder_url',
      fileSize: req.body.fileSize || 0
    });
    const savedAttachment = await attachment.save();

    const task = await Task.findById(req.params.id);
    if (task) {
      task.activity.push({ action: 'File Attached', details: `${req.employee.fullName} uploaded ${attachment.filename}.`, date: new Date() });
      await task.save();
    }

    res.status(201).json(savedAttachment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }).select('fullName avatar department position').lean();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  getCreatedTasks,
  getArchivedTasks,
  getTaskById,
  createTask,
  updateTask,
  replyToTask,
  uploadAttachment,
  getEmployees
};
