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
const logger = new LoggerService('rental');//rental is the name of this file/module.

router.get('/', async (req, res) => {
    //Return all movies that are out from the store
    const allRentals = await Rental.find({ rentalType: 'borrow' }).sort('-dateOut');
    if (allRentals && allRentals.length > 0) return res.send(allRentals);
    logger.info('No moives have been borrowed!');
    return res.status(404).send('No rentals found/retrieved!');
});

router.post('/', [auth, validate(validateRental)], async (req, res) => {
    let customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(404).send(`Customer with id: ${req.body.customerId} does not exist!`);
    if (customer.numberOfMoviesRented >= 10) return res.status(400).send('Sorry, you can not rent more than 10 movies.');

    let movie = await Movie.findById(req.body.movieId);
    if (!movie) return res.status(404).send(`Movie with id: ${req.body.movieId} was not found in the database`);
    if (movie.numberInStock <= 0) return res.status(400).send('Sorry, this movie is out of stock! Please check later.');
    let rental = await checkIfAlreadyBorrowedThisMovie(movie, customer);
    if (rental) return res.status(400).send(`${customer.name}, you have already borrowed one copy of ${movie.title} on ${rental.dateOut}`);

    rental = new Rental(
        {
            customer: {
                _id: customer._id,
                name: customer.name,
                phone: customer.phone
            },
            movie: {
                _id: movie._id,
                title: movie.title,
                dailyRentalRate: movie.dailyRentalRate
            },
            rentalType: 'borrow'//req.body.rentalType
        }
    );

    //Automatic transaction implementation
    const session = await Rental.startSession();
    if (session) {
        logger.info('Session created!', session);
        session.startTransaction();
        logger.info('Transaction started for borrowing a movie!');
    } else {
        return res.status(500).send('Session could not be created. Try later please.');
    }

    rental.dateOut = Date.now();
    if (movie.numberInStock > 0) movie.numberInStock--;
    if (customer.numberOfMoviesRented < 10) customer.numberOfMoviesRented++;
    await movie.save();
    await customer.save();
    await rental.save();

    const transaction = await createTransaction(req, res);
    await session.commitTransaction();

    if (rental && transaction) {
        logger.info('Transaction for borrowing a movie created and committed to the database!', { "transaction": transaction, "rental": rental });
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
    logger.error("There is some problem!", req.body);
    res.status(400).send('There is some problem! You can not do this transaction now.');
});

router.get('/:id', validateObjectId, async (req, res) => {
    const rental = await Rental.findById(req.params.id);
    if (rental) return res.send(rental);

    logger.info('Rental with the given id could not be found!', req.params.id);
    return res.status(404).send(`Rental with id: ${req.params.id} was not found!`);
});

async function checkIfAlreadyBorrowedThisMovie(movie, customer) {
    const rental = await Rental.lookup(customer._id, movie._id, 'borrow');
    if (!rental) return false;
    return rental;
}

function validateRental(movieRentalObject) {
    const schema = Joi.object(
        {
            customerId: Joi.objectId().required(),
            movieId: Joi.objectId().required(),
            rentalType: Joi.string()
        }
    );
    return schema.validate(movieRentalObject);
}

async function createTransaction(req, res) {
    const transaction = new Transaction(
        {
            source: req.body.movieId,
            destination: req.body.customerId,
            state: 'done',
            transactionType: 'borrow'
        }
    );
    await transaction.save();
    if (transaction) return transaction;

    logger.info('Sorry, you can not borrow the movie now. Something failed!', req.body);
    return res.status(400).send('Oops! Something failed. The movie can not be returned right now.');
}

module.exports = router;