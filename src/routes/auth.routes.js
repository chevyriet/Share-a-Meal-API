const routes = require('express').Router()
const authController = require("../controllers/auth.controller")

routes.post('/api/auth/login', authController.validateLogin, authController.login)

module.exports = routes

