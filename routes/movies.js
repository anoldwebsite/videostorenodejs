const { Movie, validateMovie } = require('../models/Movie');
const express = require('express');
const router = express.Router();
const { Genre } = require('../models/Genre');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

//Get all the movies from the database
router.get('/', async (req, res) => {
    try {
        const movies = await Movie.find()
            .sort('title');
        if (movies) res.send(movies);
        else res.status(400).send(`Can't fetch movies from the vidly database. The request returned ${movies}`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});
//Get a movie with a given id
router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (movie) res.send(`Movie you searched: ${movie}`);
        else res.send(`The movie with id: ${req.params.id} could not be deleted. Got from the database: ${movie}`);
    } catch (error) {
        console.log(error);
        res.status(400).send(`Movie with id: ${req.params.id} does not exist in the database`);
    }
});
//Create a new movie in the database
//The 2nd argument is a middleware that checks the authorization of this user who is trying to post.
//The 3rd argument is also a middleware, a route-handler in this case.
router.post('/', [auth, admin], async (req, res) => {
    const error = validateMovie(req.body);
    if (error) {
        return res.status(400).send("New movie could not be created in the database due to the non-conformity of the customer with the schema!");
    }

    try {
        const genre = await Genre.findById(req.body.genreId);
        if (!genre) return res.status(400).send('Invalid genre');

        const movie = new Movie(
            {
                title: req.body.title,
                genre: {
                    _id: genre._id,
                    name: genre.name
                },
                //genre: new Genre({ name: req.body.genre }),
                numberInStock: req.body.numberInStock,
                dailyRentalRate: req.body.dailyRentalRate
            }
        );
        await movie.save();
        if (movie) res.send(movie);
        else res.status(400).send("Movie could not be saved to the database! Try again later!");
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
});
//Edit data of an existing movie
router.put('/:id', [auth, admin], async (req, res) => {
    const error = validateMovie(req.body);
    if (error) {
        console.log(error);
        return res.status(400).send("The data of the movie could not be updated due to the non-conformity of the data with the schema as checked by Joi");
    }
    try {
        const genre = await Genre.findById(req.body.genreId);
        if (!genre) return res.status(400).send('Invalid genre.');

        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                genre: {
                    _id: genre._id,
                    name: genre.name
                    /* We did not do genre = genre because in the MongoDB database vidly, 
                    collection genre there are three fields _id, name and __v inserted automatically
                    by MongoDB and we do not want to miss up with that, so we create a genre object here.
                    */
                },
                //genre: new Genre({ name: req.body.genre }),
                numberInStock: req.body.numberInStock,
                dailyRentalRate: req.body.dailyRentalRate
            },
            {
                //omitUndefined set to true, so if some of the values are undefined, then keep what is already stored in database
                omitUndefined: true,
                new: true, //Show the updated customer
                runValidators: true //Validate the new object before updating
            }
        );
        if (movie) res.send(`Details of updated movie: ${movie}`);
        else res.status(400).send(`Movie with id: ${req.params.id} could not be updated. Database gave: ${movie}`);
    } catch (error) {
        console.log("************ Inside catch ****************");
        console.log(error);
        res.status(400).send(error.message);
    }
});
//Delete one movie the id of which is given 
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);
        if (movie) res.send(`Deleted movie, details of which are: ${movie}`);
        else res.status(404).send(`Movie with id: ${req.params.id} could not be deleted from the database. The database returned ${error.message}`);
    } catch (error) {
        res.status(404).send(`Movie with id: ${req.params.id} could not be deleted from the database. The database returned ${error.message}`);
    }
});
//Delte all the movies in one go
router.delete('/', [auth, admin], async (req, res) => {
    try {
        const movies = await Movie.deleteMany({});
        if (movies) res.send('All the movies in the database have been delted!');
        else res.status(400).send(`No movies were deleted! The request for deletion of all movies returned ${movies}`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});
module.exports = router;