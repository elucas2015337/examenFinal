'use stric'

var mongoose = require("mongoose")
var Schema = mongoose.Schema;

var UserSchema = Schema({
    usuario: String,
    password: String,
    numeroSeguidores: Number,
    numeroSeguidos: Number,
    seguidores: [{
        nombreUsuario: String,
        codigoUsuario: { type: Schema.ObjectId, ref: 'user' },
    }],
})

module.exports = mongoose.model('user', UserSchema);