//const LoggerService = require('./logger');
//const logger = new LoggerService('index');
const winston = require('winston');
require('winston-mongodb');
require('dotenv').config();

const dateFormat = () => {
    return new Date(Date.now()).toUTCString()
};

const logger = winston.createLogger(
    {
        transports: [
            new winston.transports.Console(
                {
                    level: 'info',
                }
            ),
            new winston.transports.File(
                {
                    //filename: `./logs/${route}.log`,
                    filename: 'error.log',
                    level: 'error',
                    //format: winston.format.simple()
                }
            ),
            new winston.transports.File(
                {
                    //filename: `./logs/${route}.log`,
                    filename: 'combined.log',
                    level: 'debug',
                    format: winston.format.printf(info => `Date: ${dateFormat()}, Level: ${info.level}, Message: ${info.message}`)
                }
            ),
            new winston.transports.MongoDB(
                {
                    //db: 'mongodb://localhost/vidly',
                    db: process.env.MONGODB,
                    level: 'error', //Only error messages will be logged into the MongoDB and no info or debug messages.
                    //collection: errorlogs, //Default is log
                    options: {
                        useUnifiedTopology: true
                    },
                    metaKey: 'meta',
                    storeHost: true,//value of os.host() is saved i.e., your computer name as shown on prompt in terminal.
                }
            )
        ]
    }
);//function createLogger ends here.

/* The function below, which is an error middleware in Express, catches any error in the request processing pipeline. 
//This function will ignore any erros that happen outside the context of express. For that you need to use in index.js:
//Hanlding uncaught exceptions
process.on('uncaughtException', (ex) => {
    logger.error('We got an uncaught exception!', ex);//Where logger is in file logger.js in this app.
});
OR
const winston = require('winston');
winston.handleExceptions(new winston.transports.File({filename: 'uncaughtExceptions.log'}));

Similarly, for unhandled promise rejections, you have to use:
process.on('unhandledRejection', (ex) => {
    logger.error('We got an unhandled promise rejection', ex);//Where logger is in file logger.js in this app.
});
*/
module.exports = function (err, req, res, next) {
    logger.error(err.message, { meta: err });//This has the same output as the one in block comment below.
    /*     logger.error(err.message, {
            meta: {
                message: err.message,
                name: err.name,
                stack: err.stack
            }
        }); */
    res.status(500).send('Something failed!');//500 means that server can not process the request for an unknown reason.
}

/* Dealing error handling in a separate module and then exporting
it to be used in all the other modules is due to the software engineering
principle of Separation of Concerns which results in a better app design. */
