const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller")
const authController = require('../controllers/auth.controller')
const logger = require('../config/config').logger

let database = [];
let id = 0;

router.get("/", (req, res) => {
    res.status(200).json({
      status: 200,
      result: "Hello World!",
    });
  });

//getting a users profile, if it has a valid JWT token 
router.all("/api/user/profile", authController.validateToken, userController.getUserProfile);

//handling a post request for a new user
router.post("/api/user", userController.validateUser, userController.addUser);

//getting users by searchterm
router.get("/api/user?firstName&isActive", userController.getAllUsers);

//getting a user by id
router.get("/api/user/:userId", authController.validateToken, userController.getUserById);

//deleting a user by id
router.delete("/api/user/:userId", authController.validateToken, authController.validateOwnershipUserDelete,userController.deleteUser);

//updating a user by id
router.put("/api/user/:userId", authController.validateToken, userController.validateUser, userController.validateUpdateUser, userController.updateUser);

//getting all users
router.get("/api/user/", authController.validateToken, userController.getAllUsers);

module.exports = router;
