
const router = require('express').Router();
const controller = require('../controllers');

router.post('/add-typeEquip',controller.typeEquipController.addTypeEqui);
router.get('/getAllTypeEquip', controller.typeEquipController.getAllTypeEqui);
router.get('/getAllTypeEquips', controller.typeEquipController.getActTypeEquis);

router.put('/update-typeEquip', controller.typeEquipController.updateTypeEqui);
router.post('/delete-typeEquip', controller.typeEquipController.deleteTypeEquip);



module.exports = router;