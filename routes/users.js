const lodash = require('lodash');
const { User, validate } = require('../models/User');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');

//Create a new User
//The 2nd argument is a middleware that checks the authorization of this user who is trying to post.
//The 3rd argument is also a middleware, a route-handler in this case.
router.post('/', auth, async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).send(`A new user could not be created. ${error.details[0].message}`);
    //Check if a user with this email is already registered.
    let user = await User.findOne(
        {
            email: req.body.email
        }
    );
    if (user) return res.status(400).send(`A user with email ${req.body.email} already exist! If it is your email, please login here.`);
    //Email is not found in the database. We can now register a new user with this email.
    user = new User(lodash.pick(req.body, ['name', 'email', 'password']));
    /*     user = new User(
        {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        }
    ); //This is how we did it before using the library lodash
    */
    if (!user) return res.status(400).send(`A user with email ${req.body.email} could not be created now. Please try later!`);
    const salt = await bcrypt.genSalt(10);//10 is a salt. The bigger the number, the greater the time it takes to generate salt and the harder is the passwrod to crack
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    const token = user.generateAuthToken();//generateAuthToken is a method in the schema of the class User in User.js
    //We don't want to return the password field, so we are using  a library lodash to selectively return some fields of the object user.
    if (user) res.header('x-auth-token', token).send(lodash.pick(user, ['id', 'name', 'email']));//Do not print the  password. Just print id name and email of the user on the GUI
});

module.exports = router;
