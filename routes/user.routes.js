const router = require('express').Router();
const userController = require('../controllers/userController.js');
const pictureController = require('../controllers/pictureController');

router.post("/user", userController.addUser);

router.get("/user/self", userController.userInfo);

router.put("/user/self", userController.updateUser);

router.post("/user/self/pic", pictureController.createPicture);

router.get("/user/self/pic", pictureController.getPicture);

router.delete("/user/self/pic", pictureController.deletePicture);

router.get("/verifyUserEmail", userController.verifyUser);

 module.exports = router; 