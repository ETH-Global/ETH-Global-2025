const express = require("express");
const router = express.Router();
const controllers = require("../controllers/Controllers");
require("dotenv").config();


router.get("/", (req,res) => {
    res.send("Hello");
});

router.post("/poll", (req, res) => {
    controllers.CleansObj(req,res);
});

module.exports = router;
