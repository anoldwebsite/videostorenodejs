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