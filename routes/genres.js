const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
//The most powerful schema description language and data validator for JavaScript. https://hapi.dev/family/joi/ 
const Joi = require('@hapi/joi');

//Create a new schema for the Genre class.
const genreSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: 5,
            maxlength: 50,
            validate: {
                validator: function (v) {
                    /*
                        Special Characters & digits are Not Allowed.
                        Spaces are only allowed between two words.
                        Only one space is allowed between two words.
                        Spaces at the start or at the end are consider to be invalid.
                    */
                    const pattern = /^[a-zA-z]+([\s][a-zA-Z]+)*$/ //Single word name is valid
                    //const pattern = /^[a-zA-z]+([\s][a-zA-Z]+)+$/; //Single word name as Dilshad is not valid but Dilshad Rana is valid
                    return (v == null || v.trim().length < 1) || pattern.test(v);
                },
                message: 'Special character and digits are not allowed. Only once space is allowed between words. Single word name is valid but no spaces in the beginning or at the end.'
            }
        }
    }
);

//Compiling the schema to get a class
const Genre = mongoose.model('Genre', genreSchema);

//Get all the genres from the database.
router.get('/', async (req, res) => {
    const genres = await Genre.find().sort('name');
    res.send(genres);
});

//Create a new genre in the mongodb
router.post('/', (req, res) => {
    //const error = validateGenre(req.body);
    //if (error) return res.status(400).send(error.details[0].message);
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
    //Mosh's implementation' gives error ( "value" must be of type object ) when wrong id is used or validation fails.
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

function validateGenre(genre) {
    const schema = Joi.object({
        name: Joi.string().min(3).required()
    });
    const { error } = schema.validate(genre);//Destructuring
    //const { error, value } = schema.validate(genre);//Destructuring
    //If the input is valid then the error is undefined.
    return error;
};

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
        .then(() => res.send("All genres deleted!"))
        .catch(err => res.status(400).send(err.message));
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