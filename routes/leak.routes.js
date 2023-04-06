
const router = require('express').Router();
const controller = require('../controllers');

let multer = require('multer');
let upload = multer();

router.post('/add-leak', upload.single('image'), controller.leakController.addLeak);


router.post('/update', controller.leakController.updateLeak);

    
router.get('/gain', controller.leakController.getGain);

router.get('/getAllLeaks', controller.leakController.getAllLeaks);
router.get('/getAllLeaksInPdf', controller.leakController.getAllLeaksInPdf);



router.get('/specific-book-leaks', controller.leakController.getLeaksOfSpecificBooking);

router.post('/delete', controller.leakController.deleteLeak);

module.exports = router;