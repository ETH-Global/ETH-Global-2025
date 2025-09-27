require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    environment: process.env.NODE_ENV || 'development',
    timezone: process.env.TZ || 'UTC'
  },

  // Database Configuration
  database: {
    supabase: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY
    }
  },

  // External APIs
  apis: {
    cleaning: {
      url: process.env.CLEANING_API_URL
    }
  },

  // Buffer Configuration
  buffer: {
    size: parseInt(process.env.BUFFER_SIZE) || 100,
    maxRetries: parseInt(process.env.BUFFER_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.BUFFER_RETRY_DELAY) || 5000, // milliseconds
  },

  // Cron Configuration
  cron: {
    schedule: process.env.CRON_SCHEDULE || '*/5 * * * *', // Every 5 minutes
    timezone: process.env.CRON_TIMEZONE || process.env.TZ || 'UTC',
    maxConcurrentJobs: parseInt(process.env.CRON_MAX_CONCURRENT) || 1,
    jobTimeout: parseInt(process.env.CRON_JOB_TIMEOUT) || 300000, // 5 minutes
  },

  // Lighthouse Configuration
  lighthouse: {
    apiKey: process.env.LIGHTHOUSE_API_KEY,
    privateKey: process.env.LIGHTHOUSE_PRIVATE_KEY,
    gateway: process.env.LIGHTHOUSE_GATEWAY || 'https://gateway.lighthouse.storage',
    uploadTimeout: parseInt(process.env.LIGHTHOUSE_UPLOAD_TIMEOUT) || 60000, // 1 minute
    downloadTimeout: parseInt(process.env.LIGHTHOUSE_DOWNLOAD_TIMEOUT) || 30000, // 30 seconds
    maxFileSize: parseInt(process.env.LIGHTHOUSE_MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
  },

  // Encryption Configuration
  encryption: {
    algorithm: 'aes-256-gcm',
    keyDerivation: 'sha256',
    aadText: 'lighthouse-data',
    ivLength: 16,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOG !== 'false',
    enableFile: process.env.ENABLE_FILE_LOG === 'true',
    logFile: process.env.LOG_FILE || 'app.log',
  },

  // Rate Limiting
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  },

  // Performance
  performance: {
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000, // 30 seconds
    bodyLimit: process.env.BODY_LIMIT || '10mb',
    compressionLevel: parseInt(process.env.COMPRESSION_LEVEL) || 6,
  },

  // Security
  security: {
    corsOrigin: process.env.CORS_ORIGIN || '*',
    trustedProxies: process.env.TRUSTED_PROXIES ? process.env.TRUSTED_PROXIES.split(',') : [],
    helmet: {
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    },
  },

  // Feature Flags
  features: {
    enableCron: process.env.ENABLE_CRON !== 'false',
    enableManualTrigger: process.env.ENABLE_MANUAL_TRIGGER !== 'false',
    enableBufferStats: process.env.ENABLE_BUFFER_STATS !== 'false',
    enableTransferLogs: process.env.ENABLE_TRANSFER_LOGS !== 'false',
    enableHealthCheck: process.env.ENABLE_HEALTH_CHECK !== 'false',
  },

  // Validation Rules
  validation: {
    userIdMin: 1,
    userIdMax: 9223372036854775807, // Max BIGINT
    hashPattern: /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/, // IPFS hash pattern
    maxRecordSize: parseInt(process.env.MAX_RECORD_SIZE) || 1024 * 1024, // 1MB
  },

  // Pagination
  pagination: {
    defaultLimit: parseInt(process.env.DEFAULT_PAGE_LIMIT) || 50,
    maxLimit: parseInt(process.env.MAX_PAGE_LIMIT) || 1000,
  },
};

// Validation function to check required environment variables
function validateConfig() {
  const requiredVars = [
    'SUPABASE_URL',
    'SUPABASE_KEY',
    'LIGHTHOUSE_API_KEY',
    'LIGHTHOUSE_PRIVATE_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate buffer size
  if (config.buffer.size < 1) {
    throw new Error('BUFFER_SIZE must be at least 1');
  }

  // Validate cron schedule
  const cron = require('node-cron');
  if (!cron.validate(config.cron.schedule)) {
    throw new Error(`Invalid cron schedule: ${config.cron.schedule}`);
  }

  return true;
}

// Helper functions
function isDevelopment() {
  return config.server.environment === 'development';
}

function isProduction() {
  return config.server.environment === 'production';
}

function getSupabaseConfig() {
  return config.database.supabase;
}

function getLighthouseConfig() {
  return config.lighthouse;
}

function getBufferConfig() {
  return config.buffer;
}

function getCronConfig() {
  return config.cron;
}

// Export configuration
module.exports = {
  ...config,
  validateConfig,
  isDevelopment,
  isProduction,
  getSupabaseConfig,
  getLighthouseConfig,
  getBufferConfig,
  getCronConfig,
};