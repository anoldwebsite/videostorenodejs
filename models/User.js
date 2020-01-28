const mongoose = require('mongoose');
const Joi = require('@hapi/joi');
const passwordComplexity = require('joi-password-complexity');
const jwt = require('jsonwebtoken');
const config = require('config');

//Create a new schema and pass it to mongoose.model to get a class User 
const userSchema = new mongoose.Schema(
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
);
//Writing a method that will be inherited by all instances of class User.
//key: value pair - key here is generateAuthToken and value is a function assigned to that key.
/* This method will be part of the user object itself. In order to reference self, 
we need the 'this' keyword. We can't use an arrow ftn below instead of the keyword function 
because arrow ftns don't have the 'this' key word and we need the 'this' key word 
to get the user id. In an arrow ftn, 'this' refers to the ftn calling the arrow ftn but not 
the arrow ftn itself. So, if you want to create a method that is going to be part of the object/instance,
use the regular funtion instead of arrow functions.
*/
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        //The first argument passed below is our payload that we pass as an object.
        {
            _id: this._id//This is the object id of this user in the MongoDB collection users.
        },
        config.get('jwtPrivateKey')
        //The second argument is the private key which will be used to create a digital signature. Never hardcode/store your secret in the sourcecode.
        // 'jwtPrivateKey' is the name of our app setting and not the actual secret. The actual secret is in an evironment variable, which is in a config file on the server.
    );
    return token;
};
const User = mongoose.model('User', userSchema);

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