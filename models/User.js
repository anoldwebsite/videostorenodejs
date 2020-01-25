const mongoose = require('mongoose');
const Joi = require('@hapi/joi');
const passwordComplexity = require('joi-password-complexity');

//Create a new schema and pass it to mongoose.model to get a class User 
const User = mongoose.model('User',
    new mongoose.Schema(
        {
            name: {
                type: String,
                required: true,
                minlength: 2,
                maxlength: 50
            },
            email: {
                type: String,
                unique: true,
                minlength: 5,
                maxlength: 255,
                required: true
            },
            password: {
                type: String,
                minlength: 8,
                maxlength: 1024,//Hashed password can be longer so, 1024 but in Joi validation, we use 255 as the one from req.body is a plain text password.
                required: true
            }
        }
    )
);

function validateUser(user) {
    const complexityOptions = {
        min: 8,
        max: 255,
        lowerCase: 1,
        upperCase: 1,
        numeric: 1,
        symbol: 1,
        requirementCount: 4,
    };
    //passwordComplexity(complexityOptions).validate(user.password);
    const schema = Joi.object(
        {
            name: Joi.string().min(2).max(50).required(),
            email: Joi.string().min(5).max(255).required().email(),
            //password: Joi.string().min(8).max(255).required()
            password: passwordComplexity(complexityOptions)
        }
    );
    const { error } = schema.validate(user)
    return error;
}

module.exports.User = User;
module.exports.validate = validateUser;