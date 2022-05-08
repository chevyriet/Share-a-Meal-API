const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller")

let database = [];
let id = 0;

router.get("/", (req, res) => {
    res.status(200).json({
      status: 200,
      result: "Hello World!",
    });
  });

//getting a users profile, if it has a valid JWT token (endpoint not realized yet)
router.all("/api/user/profile",userController.getUserProfile);

//handling a post request for a new user
router.post("/api/user", userController.validateUser, userController.addUser);

//getting users by searchterm
router.get("/api/user?name&isActive", userController.getAllUsers);

//getting a user by id
router.get("/api/user/:userId", userController.getUserById);

//deleting a user by id
router.delete("/api/user/:userId", userController.deleteUser);

//updating a user by id
router.put("/api/user/:userId", userController.validateUser, userController.validateUpdateUser, userController.updateUser);

//getting all users
router.get("/api/user/", userController.getAllUsers);

module.exports = router;
