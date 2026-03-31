const axios = require('axios');
const config = require('../config/index');

const n8nClient = axios.create({
  baseURL: config.N8N.BASE_URL,
  timeout: 10000,
  headers: {
    'X-N8N-API-KEY': config.N8N.API_KEY || ''
  }
});

module.exports = n8nClient;