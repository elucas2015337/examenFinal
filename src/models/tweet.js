'use stric'

var mongoose = require("mongoose")
var Schema = mongoose.Schema;

var TweetSchema = Schema({
    body: String,
    fecha: Date,
    opinion: {
        like: Number,
        dislike: Number,
    },
    listaReaccionaron: [{
        usuario: String,
        idUsuario: { type: Schema.ObjectId, ref: 'user' },
        status: Number
    }],
    listaComentarios: [{
        fechaComentario: Date,
        usuario: String,
        comentario: String,
        usuarioComentario: { type: Schema.ObjectId, ref: 'user' }
    }],
    retweetInfo: [{
        idUsuario: { type: Schema.ObjectId, ref: 'user' },
        usuario: String,
        fecha: Date,
        body: String
    }],
    usuario: { type: Schema.ObjectId, ref: 'usuario' },
})

module.exports = mongoose.model('tweet', TweetSchema);