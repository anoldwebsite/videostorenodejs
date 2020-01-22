const { Rental, validateRental } = require('../models/Rental');
const { Customer } = require('../models/Customer');
const { Movie } = require('../models/Movie');
const { Transaction } = require('../models/Transaction');
const express = require('express');
const router = express.Router();

//Get a list of all rentals
router.get('/', async (req, res) => {
    try {
        //Sorting the list of rentals in descending order by dateOut
        const rentals = await Rental.find().sort('-dateOut');
        if (rentals) {
            return res.send(rentals);
        } else {
            return res.status(400).send('List of rentals could not be retrieved from the database.');
        }
    } catch (error) {
        console.error(error);
    }
});
//Post a new rental
router.post('/', async (req, res) => {
    const error = validateRental(req.body);
    if (error) return res.status(400).send('New rental could not be created due to the non-conformity of the rental with the schema of Rental.');
    let transactionType = req.body.rentalType;
    try {
        //Create a new transaction and set its state to "initial"
        let transaction;
        if (transactionType === 'borrow') {
            transaction = new Transaction({
                source: req.body.movieId,
                destination: req.body.customerId,
                state: 'initial',
                transactiontype: transactionType
            });
        } else if (transactionType === 'return') {
            transaction = new Transaction({
                source: req.body.customerId,
                destination: req.body.movieId,
                state: 'initial',
                transactiontype: transactionType
            });
        }

        try {
            transaction = await transaction.save();
        } catch (error) {
            console.error(error);
            return res.status(400).send(`Something is not working right now. Try later please! ${error.message}`);
        }

        //Get the customer data using customer's id
        let customer;
        try {
            customer = await Customer.findById(req.body.customerId);
        } catch (error) {
            changeTransactionStatusToCancelled(transaction);
            console.error(error);
        }
        if (!customer) {
            changeTransactionStatusToCancelled(transaction);
            return res.status(400).send(`Customer with id: ${req.body.customerId} does not exitst. Use this link to register.`);
        }
        if (customer.numberOfMoviesRented === 0 && req.body.rentalType === 'return') {
            changeTransactionStatusToCancelled(transaction);
            return res.status(400).send(`${customer.name}, you have not borrowed any movie! Return not possible!`);
        }
        if (customer.numberOfMoviesRented >= 10 && req.body.rentalType === 'borrow') {
            changeTransactionStatusToCancelled(transaction);
            return res.status(400).send(`${customer.name}, Sorry! You can not borrow more than 10 movies!`);
        }

        //Get the movie data using the id of the movie.
        let movie;
        try {
            movie = await Movie.findById(req.body.movieId);
        } catch (error) {
            console.error(error);
            return res.status(400).send(`Movie with id: ${req.body.movieId} was not found!.`);
        }

        if (!movie) {
            changeTransactionStatusToCancelled(transaction)
            return res.status(400).send(`Movie with movie id: ${req.body.movieId} does not exist. Please chose a different movie!`);
        }

        //Update transaction state to "pending"
        try {
            transaction = await Transaction.findByIdAndUpdate(
                transaction._id,
                {
                    $set: {
                        state: "pending",
                    }
                }
            );
        } catch (error) {
            changeTransactionStatusToCancelled(transaction);
            console.error(error);
            return res.status('400').send(`Transaction id: ${transaction._id} was not found! Something went wrong! Transaction status could not be changed to pending!`);
        }

        let alreadyBorrowedThisOne = false;
        try {
            alreadyBorrowedThisOne = await checkIfAlreadyBorrowedThisMovie(movie, customer);
        } catch (error) {
            console.error(error);
        }

        if (req.body.rentalType === 'borrow' && alreadyBorrowedThisOne) {
            changeTransactionStatusToCancelled(transaction);
            return res.status(400).send(`${customer.name}, you have already rented one copy of this movie on ${alreadyBorrowedThisOne.dateOut}. Please rent another movie!`);
        }
        if (req.body.rentalType === 'return' && !alreadyBorrowedThisOne) {
            changeTransactionStatusToCancelled(transaction);
            return res.status(400).send(`${customer.name}, you have not borrowed movie ${movie.title} from this store. Return not possible!`);
        }

        //The customer has not borrowed this movie
        //Apply the transaction to both the Customer and Movie collections
        movie.pendingTransactions.push(transaction._id);
        customer.pendingTransactions.push(transaction._id);
        if (transactionType === 'borrow') {
            if (movie.numberInStock >= 1) movie.numberInStock--;
            else {
                changeTransactionStatusToCancelled(transaction);
                return res.status(400).send(`${customer.name}, the movie ${movie.title} is out of stock. Please check again later!`);
            }
            customer.numberOfMoviesRented++;
        }
        else if (transactionType === 'return') {
            if (customer.numberOfMoviesRented > 0) {
                customer.numberOfMoviesRented--;
                movie.numberInStock++;
            }
        }

        //Create a new rental object
        let rental = new Rental({
            customer: {
                //We might need more info about this customer which in not available inside the rental object, so we would use the _id of the customer to get more info from class Customer.
                _id: customer._id,
                name: customer.name,
                phone: customer.phone,
                $push: { pendingTransactions: transaction._id }
            },
            movie: {
                _id: movie._id,
                title: movie.title,
                dailyRentalRate: movie.dailyRentalRate,
                // pendingTransactions: {$ne: transaction._id}
                $push: { pendingTransactions: transaction._id }
                //We have a default of Date.now for property dateOut
            },
            rentalType: req.body.rentalType,
        });
        rental = await rental.save();
        if (!rental) {
            rollBackTransaction(movie, customer, transaction, transactionType, rental);
            return res.status(400).send('Something went wrong! The Rental object could not be saved!');
        }
        //*********************************************** */
        rental = await Rental.findById(rental._id);
        if (rental) {
            if (req.body.rentalType === 'borrow') rental.dateOut = Date.now();
            if (req.body.rentalType === 'return') rental.dateReturned = Date.now();
        }
        rental = await rental.save();
        if (!rental) {
            rollBackTransaction(movie, customer, transaction, transactionType, rental);
            return res.status(400).send('Something went wrong! The Rental object could not be saved!');
        }
        //*********************************************** */

        //Update the status property of the Transaction object from "pending" to "applied".
        transaction = await Transaction.findByIdAndUpdate(
            transaction._id,
            {
                $set: {
                    state: "applied",
                },
            }
        );

        if (!transaction) {
            rollBackTransaction(movie, customer, transaction, transactionType, rental);
            return res.status(400).send('Something went wrong! Transaction satus could not be changed from pending to applied!');
        }

        //Transaction completed and Transaction object saved with updates. Rental object created and saved.
        while (movie.pendingTransactions.length > 0) {
            movie.pendingTransactions.pop();
        }
        while (customer.pendingTransactions.length > 0) {
            customer.pendingTransactions.pop();
        }

        const movieSaved = await movie.save();
        if (!movieSaved) {
            rollBackTransaction(movie, customer, transaction, transactionType, rental);
            return res.status(400).send('Something went wrong! The movie object could not be updated!');
        }
        const customerSaved = await customer.save();
        if (!customerSaved) {
            rollBackTransaction(movie, customer, transaction, transactionType, rental);
            return res.status(400).send('Something went wrong! The customer object could not be updated!');
        }
        //Delete the record/document for borrowing this movie as it has been returned now.
        if (req.body.rentalType === 'return' && alreadyBorrowedThisOne) {
            try {
                const rentalToDelete = await Rental.findByIdAndDelete(alreadyBorrowedThisOne._id);
                if (!rentalToDelete) {
                    rollBackTransaction(movie, customer, transaction, transactionType, rental);
                    return res.status(400).send("The record of borrowing could not be deleted, so this transaction of return failed!")
                }
            } catch (error) {
                console.error(error);
            }
        }
        //Change the status of transaction to 'done'.
        transaction = await Transaction.findByIdAndUpdate(
            transaction._id,
            {
                $set: {
                    state: "done",
                },
            }
        );
        if (!transaction) {
            rollBackTransaction(movie, customer, transaction, transactionType, rental);
            return res.status(400).send('Something went wrong! The transaction status could not be changed from "applied" to "done" !');
        }
        if (rental && transaction) {
            return res.send(
                `
                    You ${req.body.rentalType}ed: ${rental}
                    ***********************************************
                    Transaction Details: ${transaction}
                `
            );
        }
    }
    catch (error) {
        console.error(error);
    }
});

async function rollBackTransaction(movie, customer, transaction, transactionType, rental) {
    //Rollback the transcation.
    if (transactionType === 'borrow') {
        movie.numberInStock++;
        if (customer.numberOfMoviesRented >= 1) customer.numberOfMoviesRented--;
    } else if (transactiontype === 'return') {
        if (movie.numberInStock >= 1) movie.numberInStock--;
        if (customer.numberOfMoviesRented < 10) customer.numberOfMoviesRented++;
    }
    while (movie.pendingTransactions.length > 0) {
        movie.pendingTransactions.pop();
    }
    while (customer.pendingTransactions.length > 0) {
        customer.pendingTransactions.pop();
    }
    movie = await movie.save();
    customer = await customer.save();
    //Change the status of transaction to 'canceled'.

    changeTransactionStatusToCancelled(transaction);
    //Delete record/document from the collection rental
    if (transaction.state === 'canceled') {
        const deletedRental = await Rental.findByIdAndDelete(rental._id);
        if (!deletedRental) console.error(`Document with id: ${rental._id} could not be deleted from collection rental`);
    }
};
async function rollBackTransaction2(movie, customer, transaction, transactionType, rental) {
    //Rollback the transcation.
    if (transactionType === 'borrow') {
        movie.numberInStock++;
        if (customer.numberOfMoviesRented >= 1) customer.numberOfMoviesRented--;
    } else if (transactiontype === 'return') {
        if (movie.numberInStock >= 1) movie.numberInStock--;
        if (customer.numberOfMoviesRented < 10) customer.numberOfMoviesRented++;
    }
    while (movie.pendingTransactions.length > 0) {
        movie.pendingTransactions.pop();
    }
    while (customer.pendingTransactions.length > 0) {
        customer.pendingTransactions.pop();
    }
    movie = await movie.save();
    customer = await customer.save();
    //Change the status of transaction to 'canceled'.

    changeTransactionStatusToCancelled(transaction);
    //Delete record/document from the collection rental
    if (transaction.state === 'canceled') {
        const deletedRental = await Rental.findByIdAndDelete(rental._id);
        if (!deletedRental) console.error(`Document with id: ${rental._id} could not be deleted from collection rental`);
    }
};

async function changeTransactionStatusToCancelled(transaction) {
    //Change the status of transaction to 'canceled'.
    transaction = await Transaction.findByIdAndUpdate(
        transaction._id,
        {
            $set: {
                state: "canceled",
            },
        }
    );
};


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

module.exports = router;
