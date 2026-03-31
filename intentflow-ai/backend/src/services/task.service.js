const taskRepository = require('../repositories/task.repository');
const automationRepository = require('../repositories/automation.repository');
const { ApiError, NotFoundError } = require('../utils/ApiError');
const automationService = require('./automation.service');

async function getAll(userId, filters = {}) {
  return taskRepository.findAllByUser(userId, filters);
}

async function getOne(taskId, userId) {
  const task = await taskRepository.findById(taskId, userId);
  if (!task) throw new NotFoundError('Task');
  return task;
}

async function create(taskData, userId) {
  return taskRepository.create({
    ...taskData,
    user_id: userId,
    status: taskData.status || 'pending_review',
    priority: taskData.priority || 'medium'
  });
}

async function update(taskId, userId, updates) {
  const task = await taskRepository.findById(taskId, userId);
  if (!task) throw new NotFoundError('Task');

  const prevStatus = task.status;
  const newStatus = updates.status || prevStatus;

  const updated = await taskRepository.update(taskId, userId, updates);

  // Trigger automation via n8n webhook abstraction natively or via automation REST
  // Prompt 6: "On status change to 'completed': trigger automation if automation_triggered=false"
  if (newStatus === 'completed' && prevStatus !== 'completed' && !updated.automation_triggered) {
    try {
      await automationService.triggerWorkflow('TASK_COMPLETED_WEBHOOK', { taskId, title: updated.title });
      
      // Update task to denote automation fired
      await taskRepository.update(taskId, userId, { automation_triggered: true });
    } catch (e) {
       console.warn('[TaskService] Failed to trigger automation on completion:', e.message);
    }
  }

  return updated;
}

async function partialUpdate(taskId, userId, updates) {
  return update(taskId, userId, updates);
}

async function softDelete(taskId, userId) {
  const task = await taskRepository.findById(taskId, userId);
  if (!task) throw new NotFoundError('Task');
  
  return taskRepository.softDelete(taskId, userId);
}

async function bulkCreate(tasksArray, userId) {
  const items = tasksArray.map(t => ({
    ...t,
    user_id: userId,
    status: t.status || 'pending_review',
    priority: t.priority || 'medium'
  }));
  return taskRepository.bulkCreate(items);
}

module.exports = {
  getAll, getOne, create, update, partialUpdate, softDelete, bulkCreate
};