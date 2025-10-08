import express from 'express';
import cors from 'cors';
import { config } from './config/environment';
import { db } from './config/database';
import { logger } from './shared/utils/logger';
import { errorHandler } from './shared/middleware/error-handler.middleware';
import mealRoutes from './modules/meals/routes/meal.routes';
import reportRoutes from './modules/analysis/routes/report.routes';

const app = express();

// Middleware
const allowedOrigins = config.server.corsOrigin.split(',').map(o => o.trim());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use('/uploads', express.static(config.upload.dir));

// Routes
app.use('/api/meals', mealRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  try {
    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on port ${config.server.port}`);
      logger.info(`📊 Environment: ${config.server.env}`);
      logger.info(`🔗 CORS origin: ${config.server.corsOrigin}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await db.close();
  process.exit(0);
});

start();
