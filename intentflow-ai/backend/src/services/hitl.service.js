const hitlRepository = require('../repositories/hitl.repository');
const taskRepository = require('../repositories/task.repository');
const { ApiError, NotFoundError } = require('../utils/ApiError');

exports.getPendingTasks = async (userId) => {
  return hitlRepository.getPendingTasks(userId);
};

exports.getTaskById = async (hitlId, userId) => {
  const item = await hitlRepository.findById(hitlId, userId);
  if (!item) throw new NotFoundError('Queue item');
  return item;
};

exports.confirmTask = async (hitlId, userId) => {
  const queueItem = await hitlRepository.findById(hitlId, userId);

  if (!queueItem) throw new NotFoundError('Queue item');
  // Race condition guard: only process if still pending_review
  if (queueItem.status !== 'pending_review') {
    throw new ApiError(409, `Item already resolved: ${queueItem.status}`);
  }

  // Create tasks from the extracted_tasks payload
  const tasksPayload = queueItem.extracted_tasks || [];
  const createdTasks = [];

  for (const t of tasksPayload) {
    try {
      const created = await taskRepository.create({
        user_id:          userId,
        title:            t.title,
        description:      t.description || null,
        priority:         t.priority || 'medium',
        due_date:         t.due_date || null,
        category:         t.category || 'work',
        status:           'pending',       // ✅ valid — task is approved and ready
        hitl_id:          hitlId,
        confidence_score: t.confidence_score ?? 100
      });
      createdTasks.push(created);
    } catch (err) {
      console.warn('[HITL:confirm] Failed to create task:', t.title, err.message);
    }
  }

  // ✅ 'approved' is a valid hitl_queue status (was wrongly 'confirmed')
  await hitlRepository.updateStatus(hitlId, userId, 'approved');

  return createdTasks;
};

exports.rejectTask = async (hitlId, userId, reason = '') => {
  const queueItem = await hitlRepository.findById(hitlId, userId);

  if (!queueItem) throw new NotFoundError('Queue item');
  if (queueItem.status !== 'pending_review') {
    throw new ApiError(409, `Item already resolved: ${queueItem.status}`);
  }

  await hitlRepository.updateStatus(hitlId, userId, 'rejected');

  // Log rejection to nlp_feedback for model improvement
  if (reason) {
    await hitlRepository.logNlpFeedback({
      user_id:       userId,
      raw_input:     queueItem.raw_input,        // ✅ correct schema column
      parsed_output: queueItem.extracted_tasks,  // ✅ correct schema column
      feedback:      'incorrect'
    });
  }

  return { message: 'Tasks rejected', hitlId };
};

exports.editTask = async (hitlId, patchesArray, userId) => {
  const queueItem = await hitlRepository.findById(hitlId, userId);

  if (!queueItem) throw new NotFoundError('Queue item');

  // Replace extracted_tasks with user-edited version, stay in pending_review
  await hitlRepository.updateStatus(hitlId, userId, 'pending_review', patchesArray);

  // Track corrections for NLP training
  await hitlRepository.logNlpFeedback({
    user_id:       userId,
    raw_input:     queueItem.raw_input,
    parsed_output: patchesArray,
    feedback:      'partial'
  });

  return { message: 'Tasks updated successfully in queue' };
};