const { Rental, validateRental } = require('../models/Rental');
const { Customer } = require('../models/Customer');
const { Movie } = require('../models/Movie');
const express = require('express');
const router = express.Router();

//Get a list of all rentals
router.get('/', async (req, res) => {
    try {
        //Sorting the list of rentals in descending order by dateOut
        const rentals = await Rental.find().sort('-dateOut');
        if (rentals) {
            res.send(rentals);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
});
//Post a new rental
router.post('/', async (req, res) => {
    const error = validateRental(req.body);
    if (error) {
        return res
            .status(400)
            .send(
                'New rental could not be created due to the non-conformity of the rental with the schema of Rental.'
            );
    }
    try {
        //Get the customer data using customer's id
        const customer = await Customer.findById(req.body.customerId);
        if (!customer)
            return res
                .status(400)
                .send(
                    `Customer id: ${req.body.customerId} does not exist. Please register as a customer using this link!`
                );
        //Get the movie data using the id of the movie.
        const movie = await Movie.findById(req.body.movieId);
        if (!movie) return res.status(404).send(`Movie with movie id: ${req.body.movieId} does not exist. Please chose a different movie!`);
        if (movie.numberInStock === 0) return res.status(400).send('Movie out of stock. Check again tomorrow please!');

        //Create a new rental object
        let rental = new Rental({
            customer: {
                //We might need more info about this customer which in not available inside the rental object, so we would use the _id of the customer to get more info from class Customer.
                _id: customer._id,
                name: customer.name,
                phone: customer.phone
            },
            movie: {
                _id: movie._id,
                title: movie.title,
                dailyRentalRate: movie.dailyRentalRate
                //We have a default of Date.now for property dateOut
            }
        });
        rental = await rental.save();
        if (rental) {
            movie.numberInStock--;
            const decrementedMovie = await movie.save();
            if (decrementedMovie)
                res.send(rental);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
});

module.exports = router;