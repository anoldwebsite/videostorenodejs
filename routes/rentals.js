const { Rental, validateRental } = require('../models/Rental');
const { Transaction } = require('../models/Transaction');
const { Customer } = require('../models/Customer');
const { Movie } = require('../models/Movie');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const asyncMiddleware = require('../middleware/async');

router.get('/', asyncMiddleware(async (req, res) => {
    const rentals = await Rental.find().sort('-dateOut');
    if (rentals) return res.send(rentals);
    return res.status(400).send('No rentals found!');
}));
//The 2nd argument is a middleware that checks the authorization of this user who is trying to post.
//The 3rd argument is also a middleware, a route-handler in this case.
router.post('/', auth, asyncMiddleware(async (req, res) => {
    const error = validateRental(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    /* 
    What if the customerId or movieId supplied by the user is invalid. 
    //We can do the same validation in our metho validateRental using an npm package joi-objectid which is installed if we write on terminal npm i joi-objectid --save
    if (!mongoose.Types.ObjectId.isValid(req.body.customerId)) return res.status(400).send(`Customer Id: ${req.body.customerId} is invalid!`);
    if (!mongoose.Types.ObjectId.isValid(req.body.movieId)) return res.status(400).send(`Movie id: ${req.body.movieId} is invalid!`);
    */

    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(400).send('Invalid customer. Customer not found in the database!');

    const movie = await Movie.findById(req.body.movieId);
    if (!movie) return res.status(400).send('Invalid movie.');

    if (movie.numberInStock === 0 && req.body.rentalType === 'borrow') return res.status(400).send('Movie not in stock.');

    let alreadyBorrowedThisOne = await checkIfAlreadyBorrowedThisMovie(movie, customer);

    if (req.body.rentalType === 'borrow' && alreadyBorrowedThisOne) {
        return res.status(400).send(`${customer.name}, you have already rented one copy of this movie on ${alreadyBorrowedThisOne.dateOut}. Please rent another movie!`);
    }
    if (req.body.rentalType === 'borrow' && customer.numberOfMoviesRented >= 10) {
        return res.status(400).send(`${customer.name}, you have already rented ${customer.numberOfMoviesRented} movies. Please return one to borrow another movie!`);
    }
    if (req.body.rentalType === 'return' && !alreadyBorrowedThisOne) {
        return res.status(400).send(`${customer.name}, you have not borrowed movie ${movie.title} from this store. Return not possible!`);
    }

    //The customer has not borrowed this movie. The business rule of this compan allows borrowing only one copy of a movie.

    const rental = new Rental({
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
        rentalType: req.body.rentalType,
    });
    //Atomic transactions implementation.
    const session = await Rental.startSession();
    if (session) session.startTransaction();

    if (req.body.rentalType === 'borrow') {
        rental.dateOut = Date.now();
        if (movie.numberInStock > 0) movie.numberInStock--;
        customer.numberOfMoviesRented++;
    }
    if (req.body.rentalType === 'return') {
        rental.dateReturned = Date.now();
        movie.numberInStock++;
        if (customer.numberOfMoviesRented > 0) customer.numberOfMoviesRented--;
        //Delete the record/document for borrowing this movie as it has been returned now.
        if (req.body.rentalType === 'return' && alreadyBorrowedThisOne) {
            try {
                const rentalToDelete = await Rental.findByIdAndDelete(alreadyBorrowedThisOne._id);
                if (!rentalToDelete) {
                    return res.status(400).send("The record of borrowing could not be deleted, so this transaction of return failed!")
                }
            } catch (error) {
                console.error(error);
            }
        }
    }
    await movie.save();
    await customer.save();
    await rental.save();
    const transaction = await createTransaction(req, res);
    await session.commitTransaction();
    if (rental && transaction) {
        return res.send(
            `
                        You ${req.body.rentalType}ed: 

                        ${rental}

                        ***********************************************

                        Transaction Details: 
                        
                        ${transaction}
                    `
        );
        session.endSession();
    }
    session.endSession();
    res.status(400).send("There is some problem!. You can't rent/return a movie now.");
}));

router.get('/:id', asyncMiddleware(async (req, res) => {
    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).send('The rental with the given ID was not found.');
    return res.send(rental);
}));

async function checkIfAlreadyBorrowedThisMovie(movie, customer) {
    let rental;
    try {
        rental = await Rental.find({ rentalType: 'borrow' });
        if (!rental) return false;
        //Now, we have all documents with rentalType === 'borrow'
        rental = rental.filter(rental => JSON.stringify(rental.movie._id) === JSON.stringify(movie._id));
        if (!rental) return false;
        //Now, we have document where rentalType === 'borrow' and movie._id === rentalType.movie._id
        rental = rental.filter(rental => JSON.stringify(rental.customer._id) === JSON.stringify(customer._id));
        if (!rental) return false;
        if (rental && rental.length > 0) return rental[0];//Send back the element at index 0 of array rental.
        return false;//This means the rental array is empty as this customer has not rented a copy of this movie.
    } catch (error) {
        console.error(error);
    }
};
async function createTransaction(req, res) {
    //Create a new transaction and set its state to "done"
    if (req.body.rentalType === 'borrow') {
        const transaction = new Transaction(
            {
                source: req.body.movieId,
                destination: req.body.customerId,
                state: 'done',
                transactiontype: req.body.rentalType
            }
        );
        await transaction.save();
        if (transaction) return transaction;
    } else if (req.body.rentalType === 'return') {
        const transaction = new Transaction(
            {
                source: req.body.customerId,
                destination: req.body.movieId,
                state: 'done',
                transactiontype: req.body.rentalType
            }
        );
        await transaction.save();
        if (transaction) return transaction;
    }
    return res.status(400).send(`Something is not working right now. Try later please! ${error.message}`);
};
module.exports = router; 
