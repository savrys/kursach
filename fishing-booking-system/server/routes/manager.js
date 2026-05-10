const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(authMiddleware);
router.use(roleCheck(['manager', 'admin']));

router.get('/pending-bookings', managerController.getPendingBookings);
router.get('/active-users', managerController.getActiveUsers);
router.put('/bookings/:id/approve', managerController.approveBooking);
router.put('/bookings/:id/reject', managerController.rejectBooking);
router.put('/bookings/:id/approve-cancel', managerController.approveCancelRequest);
router.put('/bookings/:id/reject-cancel', managerController.rejectCancelRequest);
router.post('/places', managerController.createPlace);
router.put('/places/:id', managerController.updatePlace);
router.delete('/places/:id', managerController.deletePlace);
router.post('/catches', managerController.addCatch);
router.delete('/stats/fishing', managerController.clearFishingStats);
router.delete('/stats/visits', managerController.clearVisitsStats);
router.get('/active-users', managerController.getActiveUsers);
router.post('/places/:id/image', managerController.uploadPlaceImage);
router.delete('/places/:id/image', managerController.deletePlaceImage);
router.post('/map-image', managerController.uploadMapImage);
router.delete('/map-image', managerController.deleteMapImage);

// Редактирование информации о базе
router.put('/info', settingsController.updateInfo);

module.exports = router;