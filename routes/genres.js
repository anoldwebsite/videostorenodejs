const { Genre, validate } = require('../models/Genre');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
//const asyncMiddleware = require('../middleware/async');
const LoggerService = require('../middleware/logger');
const logger = new LoggerService('genres');

//Get all the genres from the database.
router.get('/', async (req, res, next) => {
    const genres = await Genre.find().sort('name');
    if (genres) return res.send(genres);
    logger.info('Could not get the genres.', req.body);
    return res.status(400).send(`Can't fetch data from the database. The request returned ${genres}`);
});

//Create a new genre in the mongodb
//The 2nd argument is a middleware that checks the authorization of this user who is trying to post.
//The 3rd argument is also a middleware, a route-handler in this case.
router.post('/', [auth, admin], async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).send("A new genre could not be created probably due to non-conformity of the genre with the schema!");
    //Check if genre already exists.
    const existingGenre = await Genre.find({ name: req.body.name });
    if (existingGenre && existingGenre.length > 0) {
        logger.info('Genere already exists in the database!', existingGenre);
        return res.status(400).send(`${req.body.name} already exists in the database. ${existingGenre}`);
    }
    const genre = new Genre({
        name: req.body.name
    });
    await genre.save();
    if (genre) return res.send(genre);
    logger.info(`${req.body.name} could not be created!`, req.body);
    return res.status(400).send(`New genre could not be created. The database returned ${genre}`);
});

//put is used to update a resource in the mongodb
router.put('/:id', [auth, admin], async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).send("Genre could not be updated probably due to non-conformity of the customer with the schema!");
    //Check if genre already exists.
    const existingGenre = await Genre.find({ name: req.body.name });
    if (existingGenre && existingGenre.length > 0) {
        logger.info('Genere already exists in the database!', existingGenre);
        return res.status(400).send(`${req.body.name} already exists in the database.`);
    }
    const genre = await Genre.findByIdAndUpdate(req.params.id,
        {
            name: req.body.name
        },
        {
            new: true, //Default is false which returns the unmodified document but true returns the modified one.
            runValidators: true
        }
    );
    if (genre) return res.send(genre);
    logger.info('Genre could not be edited!', genre);
    return res.status(400).send(`Genre with id: ${re.params.id} was not updated. The update request returned ${genre}.`);
});

//delete is used to delete a genre/resouce from the MongoDB
router.delete('/:id', [auth, admin], async (req, res) => {
    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (genre) return res.send(`The Genre ${genre} was deleted from the database.`);
    logger.info('The Genre was not deleted.', req.body.name);
    return res.status(404).send(`Genre with id: ${req.params.id} was not deleted. The database returned ${genre}.`);
});

//Delete all genres from the MongoDB
router.delete('/', [auth, admin], async (req, res) => {
    //Genre.remove( {} ) //It works but is deprecated
    const genres = await Genre.deleteMany({});
    if (genres) return res.send(`Number of genres in the database: ${genres.n} Number of genres Deleted: ${genres.deletedCount}`);
    logger.info('The Genres were not deleted.');
    return res.status(400).send(`Genres were not deleted. The database returned ${genres}.`);
});

//Get genre with the given id
router.get('/:id', async (req, res) => {
    const genre = await Genre.findById(req.params.id);
    if (genre) return res.send(genre);
    logger.info(`Genre with id: ${req.params.id} does not exist in the database.`);
    return res.status(400).send(`Genre with id: ${req.params.id} was not found. The database returned ${genre}.`);
});

module.exports = router;