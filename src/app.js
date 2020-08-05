'use strict'

//VARIABLES GLOBALES
const express = require("express")
const app = express()
const bodyparser = require("body-parser")

//CARGAR RUTAS
var user_routes = require("./routes/userRoutes")
//var producto_routes = require("./routes/productoRoutes")
//var categoria_routes = require("./routes/categoriaRoutes")
//MIDDLEWARES
app.use(bodyparser.urlencoded({extend: false}))
app.use(bodyparser.json());

//CABECERAS //CORS
app.use((req, res, next) =>{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-whith, Content-Type, Accept, Access-Control-Allow-request-Method')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE')

    next();
})

//RUTAS

app.use('/api', user_routes)


//EXPORTAR
module.exports = app;