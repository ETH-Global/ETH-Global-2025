const express = require("express");
const router = express.Router();
const controllers = require("../controllers/Controllers");
const kyc = require("../controllers/verify.js");
const cronController = require("../controllers/CronController");
require("dotenv").config();


router.get("/", (req,res) => {
    res.send("Hello");
});

router.post("/poll", (req, res) => {
    controllers.CleansObj(req,res);
});

// Cron management routes
router.get("/cron/status", cronController.getStatus);
router.post("/cron/start", cronController.startCron);
router.post("/cron/stop", cronController.stopCron);
router.put("/cron/schedule", cronController.updateSchedule);
router.post("/cron/trigger", cronController.triggerManualProcessing);

// Buffer management routes
router.get("/buffer/stats", cronController.getBufferStats);
router.post("/buffer/process/:user_id", cronController.processUserBuffer);

// Transfer logs
router.get("/transfer/logs", cronController.getTransferLogs);

// Lighthouse data retrieval
router.get("/lighthouse/:hash", cronController.getLighthouseData);
router.get("/lighthouse/:hash/info", cronController.getLighthouseFileInfo);
router.get("/lighthouse/:hash/validate", cronController.validateLighthouseHash);
router.get("/lighthouse/:hash/website-uids", cronController.getWebsiteUids);

// Health check
router.get("/health", cronController.healthCheck);

router.post("/verify", (req, res) => {
    kyc.UserVerification(req, res);
});

module.exports = router;
