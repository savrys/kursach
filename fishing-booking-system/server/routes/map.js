const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/places', mapController.getAllPlaces);
router.get('/places/:id', mapController.getPlaceById);
router.get('/places/:id/status', mapController.getPlaceStatus);

module.exports = router;