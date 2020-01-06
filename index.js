const config = require('config');
require('dotenv').config();
const startupDebugger = require('debug')('app:startup');
const dbDebugger = require('debug')('app:db');

const logger = require('./logger');
const authenticator = require('./authenticator');
const Joi = require('@hapi/joi');
const helmet = require('helmet');
const morgan = require('morgan');

//Building a webserver. Express is a minimalistic and lightweight framework for building webservers.
const express = require('express');
const app = express();
//If the request object has a json object, then the module express, which is a middleware, populates req.body property.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(helmet());
app.use(morgan('tiny'));

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
if(app.get('env') === 'development'){
    app.use(morgan('tiny'));
    startupDebugger('Morgan enabled for logging http requests only in the development mode.');
}

//Db work...
dbDebugger('Connected to the database...');


const videos = [
    {
        id: 1,
        title: 'The Last of the Mohicans'
    },
    {
        id: 2,
        title: 'The Last Samurai'
    },
    {
        id: 3,
        title: 'The Godfather'
    },
];

app.get('/', (req, res) => {
    res.render('index', {//index is for the index.pug in the folder ./views
        title: "My Express App",
        message: "I am tired of writing Hello World programs!"
    })
    //res.send("I am tired of writing Hello World Programs!");
});

app.get('/api/videos', (req, res) => {
    res.send(videos);
});

function validateVideo(course) {
    const schema = Joi.object({
        title: Joi.string().min(3).required()
    });
    const { error, value } = schema.validate(course);//Destructuring
    //If the input is valid then the error is undefined.
    return error;
};

//delete is used to delete a resouce
app.delete('/api/videos/:id', (req, res) => {
    const video = videos.find(element => element.id === parseInt(req.params.id));
    if (!video) return res.status(404).send(`Viswo with id ${req.params.id} does not exist.`);//If video is undefined
    //Video exists; let's delete it.
    const videoIndex = videos.findIndex(element => element.id === parseInt(req.params.id));
    if (videoIndex !== -1) {//We have index of the course object in the array courses.
        res.send(videos.splice(videoIndex, 1));//1 means delete one object from the array starting from courseIndex
    }
});

app.get('/api/videos/:id', (req, res) => {
    const video = videos.find(element => element.id === parseInt(req.params.id));
    if (video) return res.send(video);
    res.status(404).send(`Video with id ${req.params.id} was not found!`);//Video is undefined case
});

app.get('/api/videos/:year/:month', function (req, res) {
    res.send(req.params);//http://localhost:3000/api/videos/2020/January gives
    /*     {
            "year": "2020",
            "month": "January"
        } */
});
//////////////////////////////////////////////////////////////////////
app.get('/api/videos/:sortBy', (req, res) => {
    const sortBy = req.query.sortBy;
    if(sortBy === 'asc'){
        res.send(videos.sort( (a, b) => a - b) );
    }else if( sortBy === 'des'){
        res.send(videos.sort( (a, b) => b - a ) );
    }else{
        res.send("Give a sort order asc or des");
    }
});
//////////////////////////////////////////////////////////////////////
//Query parameters are stored in an object with a bunch of key:value pairs.
//get is used to read a resource 
app.get('/api/hr/filmstars', (req, res) => {
    res.send(req.query);// http://localhost:3000/api/hr/fimstars?name=Dilshad%20Rana gives
    /*
        {
            "name": "Dilshad Rana"
        }
    */
});
//post is used to create a resource
app.post('/api/videos', (req, res) => {
    const error = validateVideo(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const video = {
        id: videos.length + 1,
        title: req.body.title
    };
    videos.push(video);
    res.send(video);
});
//put is used to update a resource
app.put('/api/videos/:id', (req, res) => {
    const video = videos.find(element => element.id === parseInt(req.params.id));
    if (!video) return res.status(404).send(`The video with id ${req.params.id} was not found.`);
    const error = validateVideo(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    video.title = req.body.title;
    const videoIndex = videos.findIndex(element => element.id === parseInt(req.params.id));
    videos[videoIndex] = video;
    res.send(video);
});

//process is an ojbect. env is a property of object proccess. PORT is the name of the environment variable 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
console.log("*************");
console.log(process.env.PORT);
console.log("*************");