const router = require('express').Router();
const controller = require('../controllers');
// const { bruteforce } = require('../middlewares/brute.force');

router.post('/doesUserHavePassword',
    // TODO: uncomment bruteforce
    // bruteforce.prevent, // error 429 if we hit this route too often
    controller.authController.doesUserHavePassword);
router.post('/login',
    // TODO: uncomment bruteforce
    // bruteforce.prevent, // error 429 if we hit this route too often
    controller.authController.login);

router.post('/createPasswordAndLogin',
    // TODO: uncomment bruteforce
    // bruteforce.prevent, // error 429 if we hit this route too often
    controller.authController.createPasswordAndLogin);

// TODO: remove registerAdmin API or strict the access with login/passowrd
router.post('/registerAdmin', controller.authController.registerAdmin);
router.post('/registerUser', controller.authController.registerUser);
router.get('/isLoggedIn', controller.authController.isLoggedIn);
router.post('/logout', controller.authController.logOut);
router.get('/users', controller.authController.getUsers);

router.post('/users/one', controller.authController.getOneUser);
router.post('/users/updateOne', controller.authController.updateOneUser);
router.post('/users/deleteOne', controller.authController.deleteOneUser);
// router.post('/decode', controller.authController.decode);

module.exports = router;
