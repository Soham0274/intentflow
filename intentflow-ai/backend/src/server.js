/**
 * IntentFlow AI — Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const config = require('./config/index');

const PORT = config.PORT || 3000;

app.listen(PORT, () => {
  console.log(`IntentFlow API running on port ${PORT}`);
});