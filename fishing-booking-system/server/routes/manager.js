const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(authMiddleware);
router.use(roleCheck(['manager', 'admin']));

// Бронирования
router.get('/bookings/pending', managerController.getPendingBookings);
router.put('/bookings/:id/approve', managerController.approveBooking);
router.put('/bookings/:id/reject', managerController.rejectBooking);
router.put('/bookings/:id/approve-cancel', managerController.approveCancelRequest);
router.put('/bookings/:id/reject-cancel', managerController.rejectCancelRequest);

// Места
router.get('/places', managerController.getAllPlaces);
router.post('/places', managerController.createPlace);
router.put('/places/:id', managerController.updatePlace);
router.delete('/places/:id', managerController.deletePlace);
router.post('/places/:id/image', managerController.uploadPlaceImage);
router.delete('/places/:id/image', managerController.deletePlaceImage);

// Пользователи
router.get('/users/active', managerController.getActiveUsers);

// Улов
router.post('/catches', managerController.addCatch);

// Статистика
router.delete('/stats/fishing', managerController.clearFishingStats);
router.delete('/stats/visits', managerController.clearVisitsStats);

// Карта
router.post('/map/image', managerController.uploadMapImage);
router.delete('/map/image', managerController.deleteMapImage);

module.exports = router;