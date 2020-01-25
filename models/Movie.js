const mongoose = require('mongoose');
const { genreSchema } = require('./Genre');
const Joi = require('@hapi/joi');

//Create a new schema for the Movie class.
const movieSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 255,
            validate:
            {
                validator: function (v) {
                    const pattern = /^[a-zA-z0-9]+([\s][a-zA-Z0-9]+)*$/ //Single word name is valid  
                    return (v == null || v.trim().length < 1) || pattern.test(v);
                }
            },
            message: 'Special character are not allowed. Only once space is allowed between words. Single word name is valid but no spaces in the beginning or at the end.'
        },
        genre: {
            type: genreSchema,
            required: true
        },
        numberInStock: {
            type: Number,
            required: true,
            min: 0,
            max: 10
        },
        dailyRentalRate: {
            type: Number,
            required: true,
            min: 0,
            max: 255
        },
        pendingTransactions: []
    }
);//movieSchema definition ends here.

//Compiling the schema to get a Movie class
const Movie = mongoose.model('Movie', movieSchema);

function validateMovie(movie) {//movie = req.body
    const schema = Joi.object(
        {
            genreId: Joi.objectId().required(),
            title: Joi.string().min(5).max(50).required(),
            numberInStock: Joi.number().min(0).max(10).required(),
            dailyRentalRate: Joi.number().min(0).required()
        }
    );
    const { error } = schema.validate(movie);
    console.log(error);
    return error;
};

module.exports.Movie = Movie;
module.exports.validateMovie = validateMovie;
