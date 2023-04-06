
const router = require('express').Router();
const controller = require('../controllers');

let multer = require('multer');
let upload = multer();

router.post('/add-equip', upload.single('image'), controller.equipController.addEquip);
router.get('/getAllEquip', controller.equipController.getAllEquipements);
router.get('/getAllEquis', controller.equipController.getActEquis);

router.put('/update-equip', upload.single('image'), controller.equipController.updateEquipement);
router.post('/delete-equip', controller.equipController.deleteEquipement);
router.get('/facteur', controller.equipController.getFacteur);

module.exports = router;