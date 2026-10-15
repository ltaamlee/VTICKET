const routesV1 = require('./v1');
const { apiLimiter } = require('../middlewares/rate-limit.middleware');

/**
 * Setup Application API Routes with Rate Limiter & Versioning
 * @param {import('express').Express} app - Express App Instance
 */
const setupRoutes = (app) => {
  app.use('/api/v1', apiLimiter, routesV1);
};

module.exports = setupRoutes;
