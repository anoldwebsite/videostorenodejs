const { Genre, validate } = require('../models/Genre');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

//Get all the genres from the database.
router.get('/', async (req, res) => {
    const genres = await Genre.find().sort('name');
    if (genres) res.send(genres);
    else res.status(400).send(`Can't fetch data from the database. The request returned ${genres}`);
});

//Create a new genre in the mongodb
//The 2nd argument is a middleware that checks the authorization of this user who is trying to post.
//The 3rd argument is also a middleware, a route-handler in this case.
router.post('/', [auth, admin], async (req, res) => {

    const error = validate(req.body);
    if (error) return res.status(400).send("A new genre could not be created probably due to non-conformity of the genre with the schema!");

    try {
        const genre = new Genre({
            name: req.body.name
        });
        await genre.save();
        if (genre) res.send(genre);
        else res.status(400).send(`New genre could not be created. The database returned ${genre}`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

//put is used to update a resource in the mongodb
router.put('/:id', [auth, admin], async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).send("Genre could not be updated probably due to non-conformity of the customer with the schema!");
    try {
        const genre = await Genre.findByIdAndUpdate(req.params.id,
            {
                name: req.body.name
            },
            {
                new: true, //Default is false which returns the unmodified document but true returns the modified one.
                runValidators: true
            }
        );
        if (genre) res.send(genre);
        else res.status(400).send(`Genre with id: ${re.params.id} was not updated. The update request returned ${genre}.`);

    } catch (error) {
        res.status(400).send(`Genre with id: ${req.params.id} was not updated. ${error.message}`);
    }
});

//delete is used to delete a genre/resouce from the MongoDB
router.delete('/:id', [auth, admin], async (req, res) => {
    try {
        const genre = await Genre.findByIdAndDelete(req.params.id);
        if (genre) res.send(genre);
        else res.status(404).send(`Genre with id: ${req.params.id} was not deleted. The database returned ${genre}.`);
    } catch (error) {
        res.status(400).send(`Genre with id: ${req.params.id} was not deleted. ${error.message}`);
    }
});

//Delete all genres from the MongoDB
router.delete('/', [auth, admin], async (req, res) => {
    //Genre.remove( {} ) //It works but is deprecated
    try {
        const genres = await Genre.deleteMany({});
        if (genres) res.send(`Number of genres in the database: ${genres.n} Number of genres Deleted: ${genres.deletedCount}`);
        else res.status(400).send(`Genres were not deleted. The database returned ${genres}.`);
    } catch (error) {
        res.status(400).send(`The genres were not deleted. ${error.message}`);
    }
});

//Get genre with the given id
router.get('/:id', async (req, res) => {
    try {
        const genre = await Genre.findById(req.params.id);
        if (genre) res.send(genre);
        else res.status(400).send(`Genre with id: ${req.params.id} was not found. The database returned ${genre}.`);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

module.exports = router;