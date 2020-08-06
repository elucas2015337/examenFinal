'use strict'

var Tweet = require('../models/tweet')
var User = require('../models/user')
var jwt  = require("../services/jwt")

function crearTweet(req, res){

    var tweet = new Tweet();
    var datos = req.body.command.split(' ');

    if(datos[1]){

        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); 
        var yyyy = today.getFullYear();
        tweet.body = ""
            for (let i = 1; i < datos.length; i++) {
                tweet.body = tweet.body +" "+ datos[i]
                
            }
            tweet.fecha = mm + '/' + dd + '/' + yyyy
            tweet.usuario = req.user.sub
            //return res.send({ message: tweet.body })
                    tweet.save((err, tweetPublicado) => {
                        if(err) return res.status(500).send({message: 'error al publicar el tweet'})
                        if(tweetPublicado){
                            res.status(200).send({usuario: req.user.usuario,
                                                    fecha: tweetPublicado.fecha,
                                                    tweet: tweetPublicado.body})
                        }else{
                            res.status(404).send({message: 'no se ha podido publicar tu tweet'})
                        }
                        
                    })
                
    }else{
        res.status(200).send({
            message: 'Escribe algo en tu tweet'
        })
    }
}

function editarTweet(req, res) {
    var nuevoBody = ""
    var datos = req.body.command.split(' ');
    if(datos[2]){
       Tweet.findById(datos[1], (err, tweetEncontrado)=>{
           if(err) return res.status(500).send({ message: 'error en la petición de tweets' })
           
           if(!tweetEncontrado) return res.status(404).send({ message: 'No hemos encontrado el tweet' })
           //return res.send({ message: req.user.sub })
           if(tweetEncontrado.usuario == req.user.sub){
              // return res.send({ message: tweetEncontrado.id })
              for (let i = 2; i < datos.length; i++) {
                  nuevoBody = nuevoBody + " " + datos[i]
                  
              }
               Tweet.findByIdAndUpdate(tweetEncontrado.id, {body: nuevoBody}, {new: true}, (err, tweetActualizado)=>{
                    if(err) return res.status(500).send({ message: "error en la petición de tweets" })
                    if(!tweetActualizado) return res.status(404).send({ message: 'No se ha podido actualizar el tweet' })
                    res.status(200).send({usuario: req.user.usuario,
                        fecha: tweetActualizado.fecha,
                        tweet: tweetActualizado.body})
               })
           }else{
               return res.send({ message: 'Este tweet no te pertenece' })
           }

       })
    }else{
        return res.send({ message: 'Introduce el id del tweet y el nuevo texto para tu tweet o no lo edites' })
    }
        
}

function eliminarTweet(req, res) {
    var datos = req.body.command.split(' ');
    if(datos[1]){
       Tweet.findById(datos[1], (err, tweetEncontrado)=>{
           if(err) return res.status(500).send({ message: 'error en la petición de tweets' })
           if(!tweetEncontrado) return res.status(404).send({ message: 'No hemos encontrado el tweet' })
           //return res.send({ message: req.user.sub })
           if(tweetEncontrado.usuario == req.user.sub){
               Tweet.findByIdAndDelete(tweetEncontrado.id, (err, tweeteliminado)=>{
                    if(err) return res.status(500).send({ message: "error en la petición de tweets" })
                    if(!tweeteliminado) return res.status(404).send({ message: 'No se ha podido eliminar el tweet' })
                    return res.status(200).send({ message: 'tweet eliminado' })
               })
           }else{
               return res.send({ message: 'Este tweet no te pertenece' })
           }

       })
    }else{
        return res.send({ message: 'Introduce el id del tweet' })
    }
}

function likeTweet(req, res){
    var datos = req.body.command.split(' ');
    
    if(datos[1]){
        Tweet.findById(datos[1], (err, tweetEncontrado)=>{
            if(err) return res.status(500).send({ message: 'Error en la petición de tweets' })
            if(!tweetEncontrado) return res.send({ message: 'no se ha encontrado el tweet'})
           // return res.send({ message: tweetEncontrado.opinion.usuariosQueReaccionaron.length })
            Tweet.countDocuments({_id: tweetEncontrado.id, "listaReaccionaron.idUsuario": req.user.sub}, (err, yaReacciono)=>{
                if(yaReacciono > 0){
                    Tweet.findOne({_id: tweetEncontrado.id, "listaReaccionaron.idUsuario": req.user.sub}, {"listaReaccionaron.$.status": 1, _id: 0}, (err, estadoUsuario)=>{
                    //Si el usuatio ya reaccinó, se hace la comprobación de que reacción hizo anteriormente, 0  si es like, 1 si es dislike
                    if(estadoUsuario.listaReaccionaron[0].status == 0){
                        //si es like, se procede a borrar la reacción del usuario
                        Tweet.findByIdAndUpdate(tweetEncontrado.id, {$inc:{'opinion.like': -1}}).exec();
                        Tweet.updateOne({_id: tweetEncontrado.id, listaReaccionaron:{$elemMatch: {idUsuario: req.user.sub}}}, {$pull:{listaReaccionaron:{idUsuario: req.user.sub}}}).exec();
                        return res.status(200).send({ message: 'Ya no te gusta este tweet' })

                    }else if(estadoUsuario.listaReaccionaron[0].status == 1){
                        //Si es dislike, se procede a cambiar el estado del usuario a 0 (like) y a modificar los valores de las reacciones, se resta un dislike y se suma un like
                        Tweet.updateOne({_id: tweetEncontrado.id, listaReaccionaron:{$elemMatch: {idUsuario: req.user.sub}}}, {$set:{"listaReaccionaron.$.status": 0}}).exec();
                        Tweet.findByIdAndUpdate(tweetEncontrado.id, {$inc:{'opinion.dislike': -1}}).exec();
                        Tweet.findByIdAndUpdate(tweetEncontrado.id, {$inc:{'opinion.like': 1}}, (err, tweetActualizado)=>{
                            if(err) return res.status(500).send({ message: 'error en la petición de tweets' })
                            if(!tweetActualizado) return res.status(404).send({ message: 'Error al actualizar el tweet' })
                            return res.send({ tweet: "Ahora te gusta este tweet" })
                        })
                    }
                    })
                }else{
                    //Si el usuario no ha reaccionado, se registra en las reacciones y se coloca el estado 0 (like) y se suma 1 al valor de los likes
                    Tweet.findByIdAndUpdate(tweetEncontrado.id, {$inc:{'opinion.like': 1}}).exec();
                    Tweet.findByIdAndUpdate(tweetEncontrado.id, {$push:{listaReaccionaron:{usuario: req.user.usuario, idUsuario: req.user.sub, status: 0}}}, {new: true}, (err, tweetActualizado)=>{
                        if(err) return res.status(500).send({ message: 'error en la petición de tweets' })
                        if(!tweetActualizado) return res.status(404).send({ message: 'error al actualizar el tweet' })
                        return res.status(200).send({ tweet: "Ahora te gusta este tweet" })
                    })
                    
                }
            })    
                
        })

    }else{
        return res.send({ message: 'Debes ingresar el id del tweet' })
    }
}

function dislikeTweet(req, res){
    var datos = req.body.command.split(' ');
    
    if(datos[1]){
        Tweet.findById(datos[1], (err, tweetEncontrado)=>{
            if(err) return res.status(500).send({ message: 'Errr en la petición de tweets' })
            if(!tweetEncontrado) return res.send({ message: 'no se ha encontrado el tweet'})
           // return res.send({ message: tweetEncontrado.opinion.usuariosQueReaccionaron.length })
            Tweet.countDocuments({_id: tweetEncontrado.id, "listaReaccionaron.idUsuario": req.user.sub}, (err, yaReacciono)=>{
                if(yaReacciono > 0){
                    Tweet.findOne({_id: tweetEncontrado.id, "listaReaccionaron.idUsuario": req.user.sub}, {"listaReaccionaron.$.status": 1, _id: 0}, (err, estadoUsuario)=>{
                        //las funciones de esta comprobación son las mismas del metodo de like, pero a la inversa
                        if(estadoUsuario.listaReaccionaron[0].status == 1){
                            Tweet.findByIdAndUpdate(tweetEncontrado.id, {$inc:{'opinion.dislike': -1}}).exec();
                            Tweet.updateOne({_id: tweetEncontrado.id, listaReaccionaron:{$elemMatch: {idUsuario: req.user.sub}}}, {$pull:{listaReaccionaron:{idUsuario: req.user.sub}}}).exec();
                            return res.status(200).send({ message: 'Ya no te disgusta este tweet' })
    
                        }else if(estadoUsuario.listaReaccionaron[0].status == 0){
                        Tweet.updateOne({_id: tweetEncontrado.id, listaReaccionaron:{$elemMatch: {idUsuario: req.user.sub}}}, {$set:{"listaReaccionaron.$.status": 1}}).exec();
                        Tweet.findByIdAndUpdate(tweetEncontrado.id, {$inc:{'opinion.like': -1}}).exec();
                        Tweet.findByIdAndUpdate(tweetEncontrado.id, {$inc:{'opinion.dislike': 1}}, (err, tweetActualizado)=>{
                            if(err) return res.status(500).send({ message: 'error en la petición de tweets' })
                            if(!tweetActualizado) return res.status(404).send({ message: 'Error al actualizar el tweet' })
                            return res.send({ tweet: "Ahora te disgusta este tweet" })
                        })
                        }
                        })
                }else{
                    Tweet.findByIdAndUpdate(tweetEncontrado.id, {$inc:{'opinion.dislike': 1}}).exec();
                    Tweet.findByIdAndUpdate(tweetEncontrado.id, {$push:{listaReaccionaron:{usuario: req.user.usuario, idUsuario: req.user.sub, status: 1}}}, {new: true}, (err, tweetActualizado)=>{
                        if(err) return res.status(500).send({ message: 'error en la petición de tweets' })
                        if(!tweetActualizado) return res.status(404).send({ message: 'error al actualizar el tweet' })
                        return res.status(200).send({ tweet: "Ahora te disgusta este tweet" })
                    })
                    
                }             
            })    
                
        })

    }else{
        return res.send({ message: 'Debes ingresar el id del tweet' })
    }
}

function comentar(req, res){
    var texto = ""
    var datos = req.body.command.split(' ');

    if(datos[1] && datos[2]){
        //recopilación del cuerpo del comentario
        for (let i = 2; i < datos.length; i++) {
            texto = texto + " " + datos[i]
            var fecha = new Date();
        }

        Tweet.findById(datos[1], (err, tweetEncontrado)=>{
            if(err) return res.send({ message: 'error en la petición de tweets' })
            if(!tweetEncontrado) return res.send({ message: 'no se ha encontrado el tweet' })
            Tweet.findByIdAndUpdate(tweetEncontrado.id, {$push:{listaComentarios:{usuarioComentario: req.user.sub, comentario: texto, fechaComentario: fecha, usuario: req.user.usuario}}}, {new: true}, (err, tweetActualizado)=>{
            //{console.log(err)
            //return err}
                if(err) return res.status(500).send({ message: 'error en la petición de usuarios' })
                if(!tweetActualizado) return res.status(404).send({ message: 'error al agregar el comentario tweet' })
                
                
            })

        })

    }else{
        return res.send({ message: 'Debes incluir todos los datos necesarios en el comando (reply_tweet + idTweet + )' })
    }
}

function retweet (req, res){
    var datos = req.body.command.split(' ');
    var comentario = "";

    if(datos[1]){
        for (let i = 2; i < datos.length; i++) {
            comentario = comentario + " " + datos[i]
            
        }
        Tweet.findById(datos[1], (err, tweetEncontrado)=>{
            if(err) return res.status(500).send({ message: 'error en la petición de tweets' })
            if(!tweetEncontrado) return res.status(404).send({ message: 'no se ha encontrado el tweet' })
            User.findById(tweetEncontrado.usuario, (err, usuarioEncontrado)=>{
                if(err) return res.status(500).send({ message: 'error en la petición de usuarios' })
                if(!usuarioEncontrado) return res.status(404).send({ message: 'No se ha encontrado el usuario' })

                //============================================================================================
                
                Tweet.findOne({usuario: req.user.sub, "retweetInfo.idTweet": tweetEncontrado.id}, (err, retweetEncontrado)=>{
                    if(err) return res.status(500).send({ message: "error en la petición de Tweets" })

                    //return res.send({ message: retweetEncontrado })
                    if(!retweetEncontrado){

                    

                var tweet = new Tweet();
                tweet.body = comentario;
                tweet.fecha = new Date();
                tweet.usuario = req.user.sub;
                tweet.retweetInfo = [{
                    idTweet: tweetEncontrado.id,
                    idUsuario: usuarioEncontrado.id,
                    usuario: usuarioEncontrado.usuario,
                    fecha: tweetEncontrado.fecha,
                    body: tweetEncontrado.body
                }]

                tweet.save((err, tweetPublicado) => {
                        if(err) return res.status(500).send({message: 'error al publicar el tweet'})
                        if(tweetPublicado){
                            res.status(200).send({usuario: req.user.usuario,
                                                    fecha: tweetPublicado.fecha,
                                                    comentario: tweetPublicado.body,
                                                    retweet: '-------------------------',
                                                    usuarioTweetOriginal: tweetPublicado.retweetInfo[0].usuario,
                                                    fechaTweetOriginal: tweetPublicado.retweetInfo[0].fecha,
                                                    tweet: tweetPublicado.retweetInfo[0].body})
                        }else{
                            res.status(404).send({message: 'no se ha podido publicar tu tweet'})
                        }
                        
                    })
                }else{
                    Tweet.findByIdAndDelete(retweetEncontrado.id, (err, tweeteliminado)=>{
                        if(err) return res.status.send({ message: 'error en la petición de Tweets' })
                        if(!tweeteliminado) return res.status(404).send({ message: 'error al eliminar el retweet' })
                        return res.status(200).send({ message: 'tweet eliminado' })
                    })
                }               
             })
    //==============================================================================================
            
            })
        })
    }else{
        return res.send({ message: "debes ingresar el id del tweet que deseas retweetear, el formato es: retweet + idTweet + comentario(opcional)" })
    }
}



module.exports={
    crearTweet,
    editarTweet,
    eliminarTweet,
    likeTweet,
    dislikeTweet,
    comentar,
    retweet
}