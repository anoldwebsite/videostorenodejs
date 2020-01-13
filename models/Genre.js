const mongoose = require('mongoose');
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

function validateGenre(genre) {
    const schema = Joi.object({
        name: Joi.string().min(3).required()
    });
    const { error } = schema.validate(genre);//Destructuring
    //const { error, value } = schema.validate(genre);//Destructuring
    //If the input is valid then the error is undefined.
    return error;
};

module.exports.Genre = Genre;
module.exports.validate = validateGenre;