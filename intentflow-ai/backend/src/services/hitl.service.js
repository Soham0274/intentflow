const hitlRepository = require('../repositories/hitl.repository');
const taskRepository = require('../repositories/task.repository');
const { ApiError, NotFoundError } = require('../utils/ApiError');

exports.getPendingTasks = async (userId) => {
  return hitlRepository.getPendingTasks(userId);
};

exports.confirmTask = async (hitlId, userId) => {
  const queueItem = await hitlRepository.findById(hitlId, userId);
  
  if (!queueItem) throw new NotFoundError('Queue item');
  if (queueItem.status !== 'pending_review') throw new ApiError(409, `Item resolved: ${queueItem.status}`);

  // Create tasks from the extracted_tasks payload
  const tasksPayload = queueItem.extracted_tasks || [];
  
  const createdTasks = [];
  for (const t of tasksPayload) {
    const created = await taskRepository.create({
      user_id: userId,
      title: t.title,
      description: t.description || null,
      priority: t.priority || 'medium',
      due_date: t.due_date,
      category: t.category,
      status: 'pending_review' // As specified by prompt 5
    });
    createdTasks.push(created);
  }

  // Update HITL status
  await hitlRepository.updateStatus(hitlId, userId, 'confirmed');

  return createdTasks;
};

exports.rejectTask = async (hitlId, userId, reason = '') => {
  const queueItem = await hitlRepository.findById(hitlId, userId);
  
  if (!queueItem) throw new NotFoundError('Queue item');
  if (queueItem.status !== 'pending_review') throw new ApiError(409, `Item resolved: ${queueItem.status}`);

  await hitlRepository.updateStatus(hitlId, userId, 'rejected');

  // Log rejection context to nlp_feedback if reason provided
  if (reason) {
     await hitlRepository.logNlpFeedback({
       user_id: userId,
       input_text: queueItem.raw_input,
       original_extraction: queueItem.extracted_tasks,
       corrections: { reason_rejected: reason }
     });
  }

  return { message: 'Tasks rejected' };
};

exports.editTask = async (hitlId, patchesArray, userId) => {
  const queueItem = await hitlRepository.findById(hitlId, userId);
  
  if (!queueItem) throw new NotFoundError('Queue item');

  // Replace task entirely or patch carefully
  // Because it's an array of tasks, we assume patchesArray is the new full array of modified extracted_tasks
  await hitlRepository.updateStatus(hitlId, userId, 'pending_review', patchesArray);
  
  // Track corrections 
  await hitlRepository.logNlpFeedback({
      user_id: userId,
      input_text: queueItem.raw_input,
      original_extraction: queueItem.extracted_tasks,
      final_task: patchesArray
  });

  return { message: 'Tasks updated successfully in queue' };
};