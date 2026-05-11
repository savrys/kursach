const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

/**
 * @swagger
 * /api/settings/map-image:
 *   get:
 *     summary: Получить изображение карты
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Изображение карты (base64 или null)
 */
router.get("/map-image", settingsController.getMapImage);

/**
 * @swagger
 * /api/settings/info:
 *   get:
 *     summary: Получить информацию о базе отдыха
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Текстовая информация (левая и правая колонка)
 */
router.get("/info", settingsController.getInfo);

/**
 * @swagger
 * /api/settings/info:
 *   put:
 *     summary: Обновить информацию о базе отдыха (менеджер)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               left: { type: string }
 *               right: { type: string }
 *     responses:
 *       200:
 *         description: Информация обновлена
 */
router.put("/info", settingsController.updateInfo);

module.exports = router;