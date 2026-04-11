const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(authMiddleware);
router.use(roleCheck(['manager', 'admin']));

router.get('/pending-bookings', managerController.getPendingBookings);
router.put('/bookings/:id/approve', managerController.approveBooking);
router.put('/bookings/:id/reject', managerController.rejectBooking);
router.post('/places', managerController.createPlace);
router.put('/places/:id', managerController.updatePlace);
router.delete('/places/:id', managerController.deletePlace);
router.post('/catches', managerController.addCatch);
router.delete('/stats/fishing', managerController.clearFishingStats);
router.delete('/stats/visits', managerController.clearVisitsStats);

module.exports = router;