
//const validateObjectId = require('../middleware/validateObjectId');
//const moment = require('moment');
const Joi = require('@hapi/joi');
const validate = require('../middleware/validate');
const { Rental } = require('../models/Rental');
const { Movie } = require('../models/Movie');
const { Customer } = require('../models/Customer');
const { Transaction } = require('../models/Transaction');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');
const express = require('express');
const router = express.Router();
const LoggerService = require('../middleware/logger');
const logger = new LoggerService('rentals');

router.get('/', async (req, res) => {
    const allReturns = await Rental.find({ rentalType: 'return' }).sort('-dateReturned');
    if (allReturns && allReturns.length > 0) return res.send(allReturns);
    logger.info('Something went wrong! No returns found or could not be retrieved!');
    return res.status(404).send('No returns found!');
});

router.post('/', [auth, validate(validateReturn)], async (req, res) => {
    /* The work done by the following two lines has been refactored to function validate() in file validate.js in the middleware folder.
    //if (!req.body.customerId) return res.status(400).send('customerId not provided');//should return 400 if customerId is not provided.
    //if (!req.body.movieId) return res.status(400).send('movieId not provided');//should return 400 if movieId is not provided.
    */

    /* The work done by the code in the line below is now in the function auth in auth.js in the middleware folder.
    //res.status(401).send('Unauthorized');//should return 401 if client is not logged in. 
    */
    //should return 404 if no rental is found for this return
    /*     const rental = await Rental.findOne(
            {
                'customer._id': req.body.customerId,
                'movie._id': req.body.movieId,
                'rentalType': req.body.rentalType
            }
        ); */
    const rental = await Rental.lookup(req.body.customerId, req.body.movieId, 'borrow');
    //console.log(` =======================================> ${rental}`);
    if (!rental) return res.status(404).send('Rental not found!');

    if (rental.dateReturned) return res.status(400).send(`Return for this rental already processed! The movie was returned on ${rental.dateReturned} .`);

    //Atomic transactions implementation
    const session = await Rental.startSession();
    if (!session) return res.status(500).send('Session could not be created. Please try later.');
    logger.info('Session created!', session);
    session.startTransaction();
    logger.info('Transaction started for returning a movie!');

    rental.calculateRentalFee();
    rental.rentalType = 'return';//Change rentalType from 'borrow' to 'return' to mark the movie as returned back. 
    await rental.save();
    //Update the stock after the return of this product/movie.
    await Movie.update(
        { _id: rental.movie._id }, //Criteria for searching the movie here is the id of the movie.
        { $inc: { numberInStock: 1 } } //The property to update
    );
    await Customer.update(
        { _id: rental.customer._id }, //Criteria for searching the customer is the id of the customer.
        { $inc: { numberOfMoviesRented: -1 } } //The property to update.
    );
    const transaction = await createTransaction(req, res);
    await session.commitTransaction();
    if (rental && transaction) {
        logger.info('Return transaction created and commited to the database!', { "transaction": transaction, "rental": rental });
        return res.send(
            `
                You ${rental.rentalType}ed:
                ${rental}
                ***********************************************************
                The details of the transaction are given below.
                ${transaction}
            `
        );
    }
    session.endSession();
    logger.error('Thee is some problem! The transaction can not be carried out now.', req.body);
    res.status(400).send('There is some problem! Sorry, the movie can not be returned now!');
    //const error = validateRental(req.body);
    //if(error) return res.status(400).send(error.details[0].message);
});

function validateReturn(movieReturnObject) {
    //console.log(movieReturnObject); //movieReturnObject is the same as req.body
    const schema = Joi.object(
        {
            customerId: Joi.objectId().required(),
            movieId: Joi.objectId().required(),
            rentalType: Joi.string()
        }
    );
    return schema.validate(movieReturnObject);
}
async function createTransaction(req, res) {
    const transaction = new Transaction(
        {
            source: req.body.customerId,
            destination: req.body.movieId,
            state: 'done',
            transactionType: 'return'
        }
    );
    await transaction.save();
    if (transaction) return transaction;

    logger.info('Sorry, you can not return the movie now. Something failed!', req.body);
    return res.status(400).send('Oops! Something failed. The movie can not be returned right now.');
}

module.exports = router;