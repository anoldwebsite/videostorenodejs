const lodash = require('lodash');
const { User, validate } = require('../models/User');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

//Create a new User
router.post('/', async (req, res) => {
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
    await user.save();
    //We don't want to return the password field, so we are using  a library lodash to selectively return some fields of the object user.
    if (user) res.send(lodash.pick(user, ['id', 'name', 'email']));
});

module.exports = router;
