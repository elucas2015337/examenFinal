'use strict'

var user = require("./UserController")
var tweet = require("./TweetController");
const { use } = require("../routes/userRoutes");

function commands(req, res){
    var command = req.body.command.split(' ');
    switch(command[0].toLowerCase()){
        case 'add_tweet':
            //return res.send({ message: "Este es el comando de añadir un tweet" });
            tweet.crearTweet(req, res);
        break;
        case 'delete_tweet':
            //return res.send({ message: "Este es el comando de eliminar un tweet" })
            tweet.eliminarTweet(req,res);
        break;
        case 'edit_tweet':
            //return res.send({ message: "Este es el comando para editar un tweet" })
            tweet.editarTweet(req, res);
        break;
        case 'view_tweets':
            //return res.send({ message: "Este es el comando para ver tweets" })
            user.showTweets(req, res);
        break;
        case 'follow':
            //return res.send({ message: "Este es el comando de dar follow" })
            user.follow(req, res);
        break;
        case 'unfollow':
            //return res.send({ message: "Este es el comando para dejar de seguir" })
            user.unfollow(req, res);
        break;
        case 'profile':
            //return res.send({ message: "Este es el comando para ver el perfil del usuario logueado" })
            user.showProfile(req, res);
        break;
        case 'login':
            //return res.send({ message: "Este es el comando para loguearse" })
            user.login(req, res);
        break;
        case 'register':
            //return res.send({ message: "Este es el comando para registrarse" })
            user.registrar(req, res);
           // return res.send(command[2])
        break;
        case 'like_tweet':
            tweet.likeTweet(req, res);
        break;
        case 'dislike_tweet':
            tweet.dislikeTweet(req, res);
        break;
        case 'reply_tweet':
            tweet.comentar(req, res);
        break;
        case 'retweet':
            tweet.retweet(req, res);
        break;
        default:
            return res.send({message: '-------------Comandos Válidos-------------',
        añadir_tweet: 'add_tweet + textoDelTweet',
        eliminar_tweet: 'delete_tweet + idTweet',
        editar_tweet: 'edit_tweet + idTweet + textoDelNuevoTweet',
        ver_tweets: 'view_tweets + username',
        follow: 'follow + username',
        unfollow: 'unfollow + username',
        ver_perfil: 'profile + username',
        login: 'login + username + password + true',
        registrarse: 'register + username + password',
        like: 'like_tweet + idTweet',
        dislike: 'dislike_tweet + idTweet',
        comentar: 'reply_tweet + idTweet + texto de respuesta',
        retweeetear: 'retweet + idTweet + comentario(opcional)'})
            //console.log('add_tweet +  textoDelTweet')
            //console.log('delete_tweet +  idTweet')
            //console.log('edit_tweet +  idTweet textoDelNuevoTweet')
            //console.log('view_tweets +  username')
            //console.log('follow + username')
            //console.log('unfollow +  username')
            //console.log('profile + username')
            //console.log('login + username password')
            //console.log('register + username password')

    }
}

module.exports={
   commands
}