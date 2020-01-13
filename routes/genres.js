const { Genre, validate } = require('../models/Genre');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

//Get all the genres from the database.
router.get('/', async (req, res) => {
    const genres = await Genre.find().sort('name');
    res.send(genres);
});

//Create a new genre in the mongodb
router.post('/', (req, res) => {

const error = validate(req.body);
if(error) return res.status(400).send("A new genre could not be created probably due to non-conformity of the customer with the schema!");

    let genre = new Genre(
        {
            //id: genres.length + 1,//The next available id //In case of mongodb, id is alloted automatically.
            name: req.body.name
        }
    );
    genre.save()
    .then(genre => res.send(genre))
    .catch( err => res.status(400).send(err.message));
    //genre = await genre.save();
    //res.send(genre);
});

//put is used to update a resource in the mongodb
router.put('/:id', (req, res) => {
    /*     Genre.findByIdAndUpdate( req.params.id, 
            {
                name: req.body.name
            },
            {
                new: true,
                runValidators: true
            }, (err, updatedGenre) => {
                if(err) return res.status(404).send(`A genre with id: ${req.params.id} was not found in the MongoDB.`);
                res.send(updatedGenre);
            }
        ); */
    //The following implementation' gives error ( "value" must be of type object ) when wrong id is used or validation fails.

    const error = validate(req.body);
    if(error) return res.status(400).send("Genre could not be updated probably due to non-conformity of the customer with the schema!");

    Genre.findByIdAndUpdate( req.params.id,
        {
            name: req.body.name
        },
        {
            new: true, //Default is false which returns the unmodified document but true returns the modified one.
            runValidators: true
        }
    )
    .then(modifiedGenre => res.send(modifiedGenre))
    .catch(err => res.status(400).send(`Genre with id: ${req.params.id} was not updated. ${err.message}`));

});



//delete is used to delete a genre/resouce from the MongoDB
router.delete('/:id', (req, res) => {
    Genre.findByIdAndDelete(req.params.id)
    .then(deltedGenre => res.send(deltedGenre))
    .catch(err => res.status(400).send(`Genre with id: ${req.params.id} was not deleted. ${err.message}`));
/*     //If id of the item to be delted is not found, the postman/insomnia just hangs in Mosh code
    const deletedGenre = await Genre.findByIdAndDelete(req.params.id);
    if (!deletedGenre) return res.status(404).send(`Genre with id: ${rep.params.id} was not deleted/found!`);
    res.send(deletedGenre); */
});

//Delete all genres from the MongoDB
router.delete('/', (req, res) => {
    //Genre.remove( {} ) //It works but is deprecated
    Genre.deleteMany({})
        .then(obj => res.send(`Number of genres in the database: ${obj.n} Number of genres Deleted: ${obj.deletedCount}`))
        .catch(err => res.status(400).send(`The genres were not deleted. ${err.message}`));
});

router.get('/:id', (req, res) => {
    Genre.findById(req.params.id, (err, genre) => {
        if (err) return res.status(404).send(`Genre with id: ${req.params.id} was not found in the MongoDB!`);
        res.send(genre);
    });
    //Mosh implemented as shown in the three lines below but they did not work in postaman with a wrong id or non-existing id.
    //const genre = await Genre.findById(req.params.id);
    //if(!genre) return res.status(404).send(`Genre with id: ${req.params.id} was not found in the MongoDB!`);
    //res.send(genre);
});

/* router.get('/:year/:month', function (req, res) {
    res.send(req.params);//http://localhost:3000/api/videos/2020/January gives
    //    {
     //       "year": "2020",
     //       "month": "January"
     //   } 
}); 
*/

/* router.get('/:sortBy', (req, res) => {
    const sortBy = req.query.sortBy;
    if(sortBy === 'asc'){
        res.send(genres.sort( (a, b) => a - b) );
    }else if( sortBy === 'des'){
        res.send(genres.sort( (a, b) => b - a ) );
    }else{
        res.send("Give a sort order asc or des");
    }
}); */

module.exports = router;