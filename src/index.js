'use stric'

const mongoose = require("mongoose")
const app = require("./app")

mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost:27017/twitterdb', { useNewUrlParser: true, useUnifiedTopology:true }).then(() =>{
    console.log('Se encuentra conectado a la Base de Datos');

    app.set('port', process.env.PORT || 3005)
    app.listen(app.get('port'), () => {
        console.log(`El servidor esta corriendo en el puerto: ${app.get('port')}`);
    })
    
}).catch(err => console.log(err))