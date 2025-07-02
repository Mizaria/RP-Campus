const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createTask,
    getTasks,
    getTask,
    deleteTask,
    getTasksByStatus,
    getTasksByUser,
    getOverdueTasks,
    addTaskNote,
    updateTaskStatus
} = require('../controllers/adminTask.controller');

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// Special routes first
router.get('/overdue', getOverdueTasks);
router.get('/status/:status', getTasksByStatus);
router.get('/user/:userId', getTasksByUser);

// Task management routes
router.route('/')
    .post(createTask)
    .get(getTasks);

router.route('/:id')
    .get(getTask)
    .delete(deleteTask);

// Task status and notes
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/notes', addTaskNote);

module.exports = router; 