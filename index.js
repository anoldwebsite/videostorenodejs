//Load the mongoose module
const mongoose = require('mongoose');
const config = require('config');//The config package gives us an elegant way to store configuration settings for our app.
require('dotenv').config();
//We can use the debug package to add debugging information to an application. Better than console.log() statements.
const startupDebugger = require('debug')('app:startup');
const dbDebugger = require('debug')('app:db');

const logger = require('./middleware/logger');//custom middleware
const authenticator = require('./middleware/authenticator');//custom middleware
//Helmet is a collection of 14 smaller middleware functions that set HTTP response headers. https://www.npmjs.com/package/helmet
const helmet = require('helmet');
//morgan is HTTP request logger middleware for node.js https://www.npmjs.com/package/morgan 
const morgan = require('morgan');
const genres = require('./routes/genres');
const customers = require('./routes/customers');
const movies = require('./routes/movies');
const home = require('./routes/home');

//Building a webserver. Express is a minimalistic and lightweight framework for building webservers.
const express = require('express');
const app = express();

//Connect to the monogodb called vidly
mongoose.connect('mongodb://localhost/vidly')//If there is no database with this name, it will be created
.then( () => console.log('Connected to database vidly...'))
.catch( err => console.error('Could not connect to the MongoDB ...'));

//If the request object has a json object, then the module express, which is a middleware, populates req.body property.
// json() is a middleware in the express framework that is used to parse the body of requests with a JSON payload
app.use(express.json());
// urlencoded() is a middleware in the express framework that is used to parse the body of requests with URL-encoded payload.
app.use(express.urlencoded({ extended: true }));
// static() is a middleware in the express framework that is used to serve static files.
app.use(express.static('public'));
app.use(helmet());
app.use(morgan('tiny'));
/* We tell express, that whereever you have the route that starts with /api/genres 
you need to delegate the handling of those routes to the genres router that we get
from this moudle. ./routes/genres */
app.use('/api/genres', genres); //For any route that starts with /api/genres use the router genres.
app.use('/api/customers', customers);
app.use('/api/movies', movies)
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