const winston = require('winston');
require('winston-mongodb');
require('dotenv').config();

const dateFormat = () => {
    return new Date(Date.now()).toUTCString()
};

class LoggerService {
    constructor(route) {
        this.log_data = null;
        this.route = route;

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
                            format: winston.format.simple()
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
        //Call exceptions.handle with a transport to handle exceptions.
        logger.exceptions.handle(new winston.transports.File({ filename: 'exceptions.log' }));
        this.logger = logger;
    };//constructor ends here.

    setLogData(log_data) {
        this.log_data = log_data
    }
    async info(message) {
        this.logger.log('info', message);
    }
    async info(message, obj) {
        //this.logger.log('info', message, { obj });
        this.logger.log('info', message, obj);
    }
    async debug(message) {
        this.logger.log('debug', message);
    }
    async debug(message, obj) {
        this.logger.log('debug', message, { obj });
    }
    async error(message) {
        this.logger.log('error', message);
    }
    async error(message, obj) {
        //this.logger.log('error', message, { obj });
        this.logger.log('error', message, obj);
    }

}

module.exports = LoggerService;


/* //Custom middleware
function log(req, res, next){
    console.log('Logging ...');
    next();
}

module.exports = log; */
