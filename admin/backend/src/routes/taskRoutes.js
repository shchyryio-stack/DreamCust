const express = require('express');
const {
  getTasks,
  getCreatedTasks,
  getArchivedTasks,
  getTaskById,
  createTask,
  updateTask,
  replyToTask,
  uploadAttachment,
  getEmployees
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/employees').get(protect, getEmployees);
router.route('/').get(protect, getTasks);
router.route('/created').get(protect, getCreatedTasks);
router.route('/archived').get(protect, getArchivedTasks);
router.route('/create').post(protect, createTask);
router.route('/:id').get(protect, getTaskById);
router.route('/update/:id').put(protect, updateTask);
router.route('/reply/:id').post(protect, replyToTask);
router.route('/upload/:id').post(protect, uploadAttachment);

module.exports = router;
