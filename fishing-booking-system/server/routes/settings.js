const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

// Публичные маршруты
router.get("/map-image", settingsController.getMapImage);
router.get("/info", settingsController.getInfo);

// Маршруты для менеджера (защита в manager.js)
router.put("/info", settingsController.updateInfo);

module.exports = router;