const router = require('express').Router();
const controller = require('../controllers');

router.post('/add', controller.bookingController.addBooking);
router.get('/list/:start/:end', controller.bookingController.getBookings);
router.post('/delete', controller.bookingController.deleteBooking);
router.get('/getAllBooking', controller.bookingController.getAllBookings);

router.put('/updateStatut', controller.bookingController.updateBookingStatut);

router.get('/getBooking/:id', controller.bookingController.getBooking);
module.exports = router;