
const router = require('express').Router();
const controller = require('../controllers');

let multer = require('multer');
let upload = multer();

router.post('/add-perimeter', upload.single('image'), controller.perimeterController.addPerimeter);
router.get('/getAllPerimeter', controller.perimeterController.getAllPerimeters);

router.get('/getAllPeris', controller.perimeterController.getActPeris);

router.put('/update-perimeter', upload.single('image'), controller.perimeterController.updatePerimeter);
router.post('/delete-perimeter', controller.perimeterController.deletePerimeter);




module.exports = router;