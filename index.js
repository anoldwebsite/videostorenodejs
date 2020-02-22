require('dotenv').config();
const LoggerService = require('./middleware/logger');
const logger = new LoggerService('logging');

//Building a webserver. Express is a minimalistic and lightweight framework for building webservers.
const express = require('express');
const app = express();

//Details of different things have been delegated to different modules below. This is a good design according to the principle of 'Separation of concern'.
require('./startup/logging')(app);
require('./startup/routes')(app); //The file routes.js exports a function and we are passing the app object to that function.
require('./startup/db')();//db.js in folder startup exports a function, so we are calling it with ();
require('./startup/config')();
require('./startup/validation')();

//If the request object has a json object, then the module express, which is a middleware, populates req.body property.
// json() is a middleware in the express framework that is used to parse the body of requests with a JSON payload
app.use(express.json());
// urlencoded() is a middleware in the express framework that is used to parse the body of requests with URL-encoded payload.
app.use(express.urlencoded({ extended: true }));
// static() is a middleware in the express framework that is used to serve static files.
app.use(express.static('public'));

//Helmet is a collection of 14 smaller middleware functions that set HTTP response headers. https://www.npmjs.com/package/helmet
const helmet = require('helmet');
app.use(helmet());

//Setting the pug package as our html template engine
app.set('view engine', 'pug');
app.set('views', './views');//Telling the app that the  pug templates are in the folder ./views

//process is an ojbect. env is a property of object proccess. PORT is the name of the environment variable 
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => logger.info(`Listening on port ${PORT}`));

module.exports = server;

//We can use the debug package to add debugging information to an application. Better than console.log() statements.
//const startupDebugger = require('debug')('app:startup');
//app.use(morgan('tiny'));
//const authenticator = require('./middleware/authenticator');//custom middleware
//const logger = require('./middleware/logger');//custom middleware not in the project now. Had it in the beginnning.
//morgan is HTTP request logger middleware for node.js https://www.npmjs.com/package/morgan 
//const morgan = require('morgan');
/* app.use(logger);
app.use(authenticator); */

/*
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`app: ${app.get('env')}`);//Getting the environement variable process.env.NODE_ENV of our app.
*/
//To enable logging of http requests only on the development machines
//We can detect the environment in which our Node application is running (development or production, etc) using app.get('env') or process.env.NODE_ENV
/* if (app.get('env') === 'development') {
    app.use(morgan('tiny'));
    startupDebugger('Morgan enabled for logging http requests only in the development mode.');
} */
