const n8nClient = require('../utils/n8nClient');
const automationRepository = require('../repositories/automation.repository');

async function triggerWorkflow(workflowId, payload) {
  // Uses webhook or API to execute
  // Prompt 7: POST to n8n {N8N_BASE_URL}/api/v1/workflows/{workflowId}/run
  const res = await n8nClient.post(`/api/v1/workflows/${workflowId}/run`, payload);

  const executionId = res.data?.executionId || res.data?.id || `sim_${Date.now()}`;
  
  await automationRepository.createLog({
    workflow_id: workflowId,
    execution_id: executionId,
    status: 'triggered',
    result: payload
  });

  return { executionId, status: 'triggered' };
}

async function getExecutionStatus(executionId) {
  try {
    const res = await n8nClient.get(`/api/v1/executions/${executionId}`);
    return {
      executionId,
      status: res.data.status || 'unknown',
      finishedAt: res.data.finishedAt,
      data: res.data
    };
  } catch (err) {
    return { executionId, status: 'error', error: err.message };
  }
}

async function listWorkflows() {
  const res = await n8nClient.get(`/api/v1/workflows`);
  const data = res.data?.data || res.data || [];
  return data.map(w => ({ id: w.id, name: w.name, active: w.active }));
}

async function handleWebhookCallback(payload, secret) {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (expected && secret !== expected) {
     throw new Error('Invalid webhook secret');
  }

  // Update logic assuming payload conveys `{ executionId, status }`
  if (payload.executionId && payload.status) {
    await automationRepository.updateLogStatus(payload.executionId, payload.status, payload);
  }
  return { success: true };
}

module.exports = {
  triggerWorkflow,
  getExecutionStatus,
  listWorkflows,
  handleWebhookCallback
};