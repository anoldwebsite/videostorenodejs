require('express-async-errors');
//const winston = require('winston');
const LoggerService = require('../middleware/logger');
const logger = new LoggerService('logging');
require('dotenv').config();

module.exports = function (app) {
/*     //process is an ojbect. env is a property of object proccess. PORT is the name of the environment variable 
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => logger.info(`Listening on port ${PORT}`)); */

    //Hanlding uncaught exceptions
    process.on('uncaughtException', (ex) => {
        logger.error('We got an uncaught exception!', ex);
    });
    //throw new Error('Uncaught exception testing!');

    //Handling unhandled promise rejections.
    process.on('unhandledRejection', (ex) => {
        logger.error('We got an unhandled promise rejection', ex)
    });
    //const p = Promise.reject(new Error('Something failed again!'));
    //p.then(() => logger.info('Done!'));//Note that we have no catch for the promise.
};
