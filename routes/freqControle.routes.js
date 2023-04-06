
const router = require('express').Router();
const controller = require('../controllers');


router.get('/getAllFreqContr', controller.freqController.getAllFrequence);
router.post('/update-FreqContr', controller.freqController.updateFrequence);



module.exports = router;