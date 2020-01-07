const config = require('config');//The config package gives us an elegant way to store configuration settings for our app.
require('dotenv').config();
//We can use the debug package to add debugging information to an application. Better than console.log() statements.
const startupDebugger = require('debug')('app:startup');
const dbDebugger = require('debug')('app:db');

const logger = require('./middleware/logger');//custom middleware
const authenticator = require('./middleware/authenticator');//custom middleware
const helmet = require('helmet');
const morgan = require('morgan');
const genres = require('./routes/genres');
const home = require('./routes/home');

//Building a webserver. Express is a minimalistic and lightweight framework for building webservers.
const express = require('express');
const app = express();
//If the request object has a json object, then the module express, which is a middleware, populates req.body property.
// json() is a middleware in the express framework that is used to parse the body of requests with a JSON payload
app.use(express.json());
// urlencoded() is a middleware in the express framework that is used to parse the body of requests with URL-encoded payload.
app.use(express.urlencoded({ extended: true }));
// static() is a middleware in the express framework that is used to serve static files.
app.use(express.static('public'));
app.use(helmet());
app.use(morgan('tiny'));
app.use('/api/genres', genres); //For any route that starts with /api/videos use the router videos.
app.use('/', home); //For home route e.g. lochalhost:3000 or netflix.com take route home in moudle home.js

//Setting the pug package as our html template engine
app.set('view engine', 'pug');
app.set('views', './views');//Telling the app that the  pug templates are in the folder ./views


//Configuration
console.log('Application Name: ' + config.get('name'));
console.log('Mail Server: ' + config.get('mail.host'));
console.log('Mail Password: ' + config.get('mail.password'));

app.use(logger);
app.use(authenticator);

/* 
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`app: ${app.get('env')}`);//Getting the environement variable process.env.NODE_ENV of our app. 
*/
//To enable logging of http requests only on the development machines
//We can detect the environment in which our Node application is running (development or production, etc) using app.get('env') or process.env.NODE_ENV
if(app.get('env') === 'development'){
    app.use(morgan('tiny'));
    startupDebugger('Morgan enabled for logging http requests only in the development mode.');
}

//Db work...
dbDebugger('Connected to the database...');

//process is an ojbect. env is a property of object proccess. PORT is the name of the environment variable 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
console.log("*************");
console.log(process.env.PORT);
console.log("*************");