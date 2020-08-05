'use strict'

var jwt = require('jwt-simple')
var moment = require('moment')
var secret = 'clave_secreta_2015337'

exports.ensureAuth = function (req, res, next) {
    var command = req.body.command.split(' ');
    if(!req.headers.authorization){
        if(command[0].toLowerCase() == 'add_tweet' || command[0].toLowerCase() == 'delete_tweet' || command[0].toLowerCase() == 'edit_tweet' || command[0].toLowerCase() == 'view_tweets' || command[0].toLowerCase() == 'follow' || command[0].toLowerCase() == 'unfollow' || command[0].toLowerCase() == 'profile'){
            return res.status(403).send({message: 'la peticion no tiene la cabeza autenticacion'})
        }else{
                next();
            }
       
    }else{

    var token = req.headers.authorization.replace(/['"]+/g, '')

    try {
        var payload = jwt.decode(token, secret)
        if(payload.exp <= moment().unix()){
            return res.status(401).send({
                message: 'el token ha exporirado'
            })
        }
    } catch (error) {
        return res.status(404).send({
            message: 'el token no es valido'
        })
    }


    req.user = payload
    next()
}
}