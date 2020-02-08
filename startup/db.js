const LoggerService = require('../middleware/logger');
const logger = new LoggerService('db');
require('dotenv').config();
//Load the mongoose module
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);//https://mongoosejs.com/docs/deprecations.html
mongoose.set('useCreateIndex', true);
//const dbDebugger = require('debug')('app:db');


module.exports = function () {
    //Connect to the monogodb called vidly
    //mongoose.connect('mongodb://localhost/vidly', { useNewUrlParser: true, useUnifiedTopology: true })//If there is no database with this name, it will be created
    mongoose.connect(process.env.MONGODB, { useNewUrlParser: true, useUnifiedTopology: true })//If there is no database with this name, it will be created
        .then(() => logger.info('Connected to database vidly...'))
    //.catch(err => logger.error('Could not connect to the MongoDB ...', err));//See comments below
    /* 
        Not needed as we are handling it with 
            //Handling unhandled promise rejections.
                process.on('unhandledRejection', (ex) => {
                logger.error('We got an unhandled promise rejection', ex)
            });
    */

    //dbDebugger('Connected to the database...');
};