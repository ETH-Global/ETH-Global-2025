const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const middleware = require("./middlewares/Middlewares");
const CronService = require("./services/CronService");
const config = require("./config/config");

// Validate configuration on startup
// try {
//   config.validateConfig();
//   console.log("✅ Configuration validated successfully");
// } catch (error) {
//   console.error("❌ Configuration validation failed:", error.message);
//   process.exit(1);
// }

const PORT = config.server.port;

// Initialize cron service
const cronService = new CronService();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("", middleware.authenticate_token);
app.use("", middleware.authorize_user);

app.use("", require("./routes/Routes"));

app.listen(PORT, (error) => {
  if (error) throw error;

  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Buffer size: ${config.buffer.size}`);
  console.log(`⏰ Cron schedule: ${config.cron.schedule}`);
  console.log(`🌍 Environment: ${config.server.environment}`);

  // Start the cron job for buffer processing if enabled
//   if (config.features.enableCron) {
//     try {
//       cronService.start();
//       console.log('✅ Buffer processing cron job initialized successfully');
//     } catch (error) {
//       console.error('❌ Failed to initialize cron job:', error);
//     }
//   } else {
//     console.log('⚠️  Cron job disabled via configuration');
//   }
});
