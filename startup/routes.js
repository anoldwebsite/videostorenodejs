const express = require('express');
const genres = require('../routes/genres');
const customers = require('../routes/customers');
const movies = require('../routes/movies');
const rentals = require('../routes/rentals');
const users = require('../routes/users');
const auth = require('../routes/auth');
const home = require('../routes/home');
const error = require('../middleware/error');

module.exports = function (app) {//Takes the app object as argument supplied to it from file index.js
    app.use(express.json());

    /* We tell express, that whereever you have the route that starts with /api/genres 
    you need to delegate the handling of those routes to the genres router that we get
    from this moudle. ./routes/genres */
    app.use('/api/genres', genres); //For any route that starts with /api/genres use the router genres.
    app.use('/api/customers', customers);
    app.use('/api/movies', movies);
    app.use('/api/rentals', rentals);
    app.use('/api/users', users);
    app.use('/api/auth', auth);
    app.use('/', home); //For home route e.g. lochalhost:3000 or netflix.com take route home in moudle home.js
    //A single place to handle errors in the app which makes it easy to change the message etc. 
    app.use(error);//We are not calling the ftn. We are passing a reference to that ftn, which is in file ./middleware/error.js.
};