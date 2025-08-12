import { Queue, Worker, QueueEvents } from 'bullmq';
import { config } from './index';
import { logger } from './logger';

// Parse Redis URL to get connection details
const redisUrl = new URL(config.redisUrl);

// Queue configuration
const queueConfig = {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    password: config.redisPassword || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Background sync queue for offline changes
export const backgroundSyncQueue = new Queue('background-sync', queueConfig);

// Notification queue for push notifications
export const notificationQueue = new Queue('notifications', queueConfig);

// File processing queue for attachments
export const fileProcessingQueue = new Queue('file-processing', queueConfig);

// Geolocation queue for reverse geocoding
export const geolocationQueue = new Queue('geolocation', queueConfig);

// Queue events for monitoring
const backgroundSyncEvents = new QueueEvents('background-sync', {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    password: config.redisPassword || undefined,
  },
});

const notificationEvents = new QueueEvents('notifications', {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    password: config.redisPassword || undefined,
  },
});

const fileProcessingEvents = new QueueEvents('file-processing', {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    password: config.redisPassword || undefined,
  },
});

const geolocationEvents = new QueueEvents('geolocation', {
  connection: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    password: config.redisPassword || undefined,
  },
});

// Event listeners
backgroundSyncEvents.on('completed', ({ jobId }) => {
  logger.info(`Background sync job ${jobId} completed`);
});

backgroundSyncEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Background sync job ${jobId} failed: ${failedReason}`);
});

notificationEvents.on('completed', ({ jobId }) => {
  logger.info(`Notification job ${jobId} completed`);
});

notificationEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Notification job ${jobId} failed: ${failedReason}`);
});

fileProcessingEvents.on('completed', ({ jobId }) => {
  logger.info(`File processing job ${jobId} completed`);
});

fileProcessingEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`File processing job ${jobId} failed: ${failedReason}`);
});

geolocationEvents.on('completed', ({ jobId }) => {
  logger.info(`Geolocation job ${jobId} completed`);
});

geolocationEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Geolocation job ${jobId} failed: ${failedReason}`);
});

export const initializeQueues = async (): Promise<void> => {
  try {
    logger.info('Initializing job queues...');
    
    // Add any startup jobs here if needed
    
    logger.info('Job queues initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize job queues:', error);
    throw error;
  }
};

export const closeQueues = async (): Promise<void> => {
  try {
    await Promise.all([
      backgroundSyncQueue.close(),
      notificationQueue.close(),
      fileProcessingQueue.close(),
      geolocationQueue.close(),
      backgroundSyncEvents.close(),
      notificationEvents.close(),
      fileProcessingEvents.close(),
      geolocationEvents.close(),
    ]);
    logger.info('All queues closed successfully');
  } catch (error) {
    logger.error('Failed to close queues:', error);
  }
};
