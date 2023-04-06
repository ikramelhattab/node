
const router = require('express').Router();
const controller = require('../controllers');

router.post('/add-typesMission',controller.typesMissionController.addTypsMission);
router.get('/getAlltypesMission', controller.typesMissionController.getAllTypesMission);

router.get('/getAllMissions', controller.typesMissionController.getActTypesMissions);

router.put('/update-typesMission', controller.typesMissionController.updateTypesMission);
router.post('/delete-typesMission', controller.typesMissionController.deleteTypeMission);


module.exports = router;