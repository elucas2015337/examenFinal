'use strict'

//IMPORTS
var bcrypt = require('bcrypt-nodejs')
var User =  require('../models/user')
var Tweet = require('../models/tweet')
var jwt  = require("../services/jwt")
var path = require('path')
var fs = require('fs')


function registrar(req, res){
    var user = new User();
    var datos = req.body.command.split(' ');
    
//return res.send(datos[2])
    if(datos[1] && datos[2]){
        
        user.usuario = datos[1]
        
        User.find({ $or: [
            {usuario: datos[1]}
        ]}).exec((err, users) => {
           //{
                   //console.log(users)
                 //  return users
              //  } 
            //return res.send(datos[2])
            if(err) return res.status(500).send({message: 'Error en la peticion de usuarios'})
            if(users && users.length >= 1){
                return res.status(500).send({message: 'el usuario ya existe'});
               // console.log(':/')
            }else{
                bcrypt.hash(datos[2], null, null, (err, hash) => {
                    user.password = hash;

                    user.save((err, usuarioGuardado) => {
                        if(err) return res.status(500).send({message: 'error al guardar el usuario'})
                        if(usuarioGuardado){
                            res.status(200).send({user: usuarioGuardado})
                            //console.log(usuarioGuardado)
                        }else{
                            res.status(404).send({message: 'no se ha podido registrar el usuario'})
                        }
                        
                    })
                })
            }
        })
    }else{
        res.status(200).send({
            message: 'Rellene todos los datos necesarios'
        })
    }
}

function login(req, res){
    var datos = req.body.command.split(' ');
    var tipoUsuario;

    User.findOne({ usuario: datos[1] }, (err, usuario)=>{
        if(err) return res.status(500).send({ message: 'Error en la peticion' }) 
        if(!usuario) return res.status(404).send({ message: 'error al listar el usuario' })   
        
            tipoUsuario = 'Bienvenido '  + usuario.usuario

    if(usuario){
        bcrypt.compare(datos[2], usuario.password, (err, check)=>{
            if(check){
                if(datos[3]){

                        return res.status(200).send({ token: jwt.createToken(usuario), tipoUsuario})
                }else{
                    usuario.password = undefined;
                    return res.status(200).send({ user: usuario })
                }

            }else{
                return res.status(404).send({ message: 'El usuario no se ha podido identificar' })
            }
        })
    }else{
        return res.status(404).send({ message: 'El usuario no se ha podido logear' })
    }
    })
}

function follow(req, res) {
    var datos = req.body.command.split(' ');

    if(datos[1] && datos[1] != req.user.usuario){
        User.findOne({usuario: datos[1]}, (err, usuarioEncontrado)=>{
            if(err) return res.status(500).send({ message: 'error en la petición de usuarios'})
            if(!usuarioEncontrado) return res.status(404).send({ message: 'no hemos encontrado al usuario a seguir' })
            User.countDocuments({_id: usuarioEncontrado.id, "seguidores.codigoUsuario": req.user.sub}, (err, yasiguiendo)=>{
                if (yasiguiendo == 0) {
                    User.updateOne({_id: usuarioEncontrado.id}, {$inc:{numeroSeguidores: 1}}).exec();
                    User.updateOne({_id: req.user.sub}, {$inc:{numeroSeguidos: 1}}).exec();
                    User.findByIdAndUpdate(usuarioEncontrado.id, {$push:{seguidores:{nombreUsuario: req.user.usuario, codigoUsuario: req.user.sub}}}, {new: true}, (err, usuarioActualizado)=>{
                        if(err) return res.status(500).send({ message: 'error en la petición de usuarios' })
                        if(!usuarioActualizado) return res.status(404).send({ message: 'error al actualizar el usuario' })
                        return res.status(200).send({ usuario_Seguido: "Ahora sigues a " + usuarioActualizado.usuario })
                    })
                } else {
                    return res.send({ message: 'Ya sigues a ' + usuarioEncontrado.usuario })
                }
            })
        })

    }else{
        return res.send({ message: 'ingrese el nombre del usuario al que desea seguir, no puedes ingresar tu propio usuario'})
    }
}

function unfollow(req, res){
    var datos = req.body.command.split(' ');

    if(datos[1] && datos[1] != req.user.usuario){
        User.findOne({usuario: datos[1]}, (err, usuarioEncontrado)=>{
            if(err) return res.status(500).send({ message: 'error en la petición de usuarios'})
            if(!usuarioEncontrado) return res.status(404).send({ message: 'no hemos encontrado al usuario a seguir' })
            User.countDocuments({_id: usuarioEncontrado.id, "seguidores.codigoUsuario": req.user.sub}, (err, yasiguiendo)=>{
                if (yasiguiendo > 0) {
                    User.updateOne({_id: usuarioEncontrado.id}, {$inc:{numeroSeguidores: -1}}).exec();
                    User.updateOne({_id: req.user.sub}, {$inc:{numeroSeguidos: -1}}).exec();
                    User.updateOne({_id: usuarioEncontrado.id, seguidores:{$elemMatch: {codigoUsuario: req.user.sub}}}, {$pull:{seguidores:{codigoUsuario: req.user.sub}}}, (err, usuarioBorrado)=>{
                        return res.status(200).send({ message: "Has dejado de seguir a " + usuarioEncontrado.usuario, usuarioBorrado })
                    })
                } else {
                    return res.send({ message: 'No sigues a ' + usuarioEncontrado.usuario + " así que no puedes dejarle de seguir" })
                }
            })
        })

    }else{
        return res.send({ message: 'ingrese el nombre del usuario al que deseas dejar de seguir, no puedes ingresar tu propio usuario'})
    }
}

function showProfile(req, res){

    var datos = req.body.command.split(' ');
    var numeroTweets = 0;
    if(datos[1]){
        User.findOne({usuario: datos[1]}, (err, usuarioEncontrado)=>{
            if(err) return res.status(500).send({ message: 'Error en la petición de usuarios' })
            if(!usuarioEncontrado) return res.status(404).send({ message: 'No hemos encontrado el usuario solicitado' })
           // User.countDocuments({ _id: usuarioEncontrado.id, "seguidores.codigoUsuario": req.user.sub }, (err, siguiendo)=>{
             //   if(siguiendo <= 1 || usuarioEncontrado.user == req.user.usuario){
                    Tweet.find({ usuario: usuarioEncontrado.id }, (err, tweesEncontrados)=>{
                        numeroTweets = tweesEncontrados.length;
                        if(err) return res.status(500).send({ message: 'Error en la petición de los Tweets' })
                        if(tweesEncontrados.length == 0) tweesEncontrados = 'Este usuario aún no tiene tweets'
                        //return res.send({ message: tweesEncontrados.length })
                        return res.status(200).send({ Usuario: usuarioEncontrado.usuario,
                                                     estado: ' Seguidores: ' + usuarioEncontrado.numeroSeguidores + ",  Siguiendo: " + usuarioEncontrado.numeroSeguidos + ",  Tweets: " + numeroTweets,
                                                    Tweets: tweesEncontrados})

                    })
              //  }else{
                //    return res.send({ message: 'Aún no sigues a ' + usuarioEncontrado.usuario + ', síguelo para poder ver su' })
               // }
            //})
        })
    }else{
        return res.send({ message: 'Ingrese el nombre del usuario del cual desea ver el perfil' })
    }
      
    
}

function showTweets(req, res){
    var datos = req.body.command.split(' ');

    if(datos[1]){
        User.findOne({usuario: datos[1]}, (err, usuarioEncontrado)=>{
            if(err) return res.status(500).send({ message: 'Error en la petición de usuarios' })
            if(!usuarioEncontrado) return res.status(404).send({ message: 'No hemos encontrado el usuario solicitado' })

                    Tweet.find({ usuario: usuarioEncontrado.id }, {listaReaccionaron: 0, listaComentarios: 0}, (err, tweesEncontrados)=>{
                        if(err) return res.status(500).send({ message: 'Error en la petición de los Tweets' })
                        if(tweesEncontrados.length == 0) tweesEncontrados = 'Este usuario aún no tiene tweets'
                        //return res.send({ message: tweesEncontrados.length })
                        return res.status(200).send({ Tweets: tweesEncontrados })

                    })
                
        })
    }else{
        return res.send({ message: 'Ingrese el nombre del usuario del cual quiere ver los tweets' })
    }
}

module.exports={
    registrar,
    login,
    follow,
    unfollow,
    showProfile,
    showTweets
}