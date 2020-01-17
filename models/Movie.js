const mongoose = require('mongoose');
const { genreSchema } = require('./Genre');
const Joi = require('@hapi/joi');

//Create a new schema for the Movie class.
const movieSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            minlength: 2,
            maxlength: 50,
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
        numberInStock: Number,
        dailyRentalRate: Number
    }
);//movieSchema definition ends here.

//Compiling the schema to get a Movie class
const Movie = mongoose.model('Movie', movieSchema);

function validateMovie(movie) {//movie = req.body
    const schema = Joi.object(
        {
            title: Joi.string().min(2).max(50).required(),
            genre: Joi.string().min(2),
            /*             genre: Joi.object({
                            name: Joi.string().min(3).required()
                        }), */
            numberInStock: Joi.number().min(0),
            dailyRentalRate: Joi.number().min(0)
        }
    );
    const { error } = schema.validate(movie);
    console.log(error);
    return error;
};

module.exports.Movie = Movie;
module.exports.validateMovie = validateMovie;
