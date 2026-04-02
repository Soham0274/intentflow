/**
 * API Documentation Routes
 */

const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../docs/swagger');

router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'IntentFlow AI API Documentation'
}));

router.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

module.exports = router;