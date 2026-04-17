const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

router.get("/map-image", settingsController.getMapImage);

module.exports = router;
