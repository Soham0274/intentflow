/**
 * n8n Config — IntentFlow AI
 * n8n base URL (ngrok) and workflow ID mappings
 */

const config = require('./index');

const n8nConfig = {
  baseUrl: config.n8n.baseUrl,
  apiKey: config.n8n.apiKey,
  webhookSecret: config.n8n.webhookSecret,
  workflows: {
    taskCreated: process.env.N8N_WORKFLOW_TASK_CREATED || 'task-created',
    taskCompleted: process.env.N8N_WORKFLOW_TASK_COMPLETED || 'task-completed',
    dailyDigest: process.env.N8N_WORKFLOW_DAILY_DIGEST || 'daily-digest',
  },
};

module.exports = n8nConfig;