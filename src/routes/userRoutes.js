'use stric'

var express = require("express")
//var UserController = require("../controllers/userController")
var ControladorPrincipal = require("../controllers/ControladorPrincipal")
var md_auth = require('../middlewares/authenticated')


//RUTAS
var api = express.Router();
api.post('/commands', md_auth.ensureAuth, ControladorPrincipal.commands)

module.exports = api;