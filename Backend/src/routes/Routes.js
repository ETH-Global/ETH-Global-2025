const express = require("express");
const router = express.Router();
const controllers = require("../controllers/Controllers");
const kyc = require("../controllers/verify.js");
require("dotenv").config();


router.get("/", (req,res) => {
    res.send("Hello");
});

router.post("/poll", (req, res) => {
    controllers.CleansObj(req,res);
});

router.post("/verify", (req, res) => {
    kyc.UserVerification(req, res);
});

module.exports = router;
