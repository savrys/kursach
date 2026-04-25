const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/fishing/top', statsController.getTopFishermen);
router.get('/visits/top', statsController.getTopVisitors);
router.post('/visits', statsController.updateVisitTime);

module.exports = router;