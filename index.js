const express = require('express');
const app = express();
const db = require("./models");
const router = require('./routes/user.routes.js');
require('dotenv').config();
var statsDClient = require('statsd-client')
var sdc = new statsDClient({host: 'localhost', port: 8125, debug: true});
const morgan = require('morgan');
// require('./config/env.config')

// Syncing the DB using Sequelize
db.sequelize.sync()
.then((
    console.log("DB sync done!")
));

//Middlewear
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(morgan('tiny'));

// Health Check endpoint - returns 200 HTTP status code 
app.get('/healthz', (req,res) => {
    sdc.increment('/healthz');
    console.log("hit /healthz");
    res.status(200).send();
})

// Router
app.use('/v1', router);

const PORT = 5001;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`))

module.exports = app;
