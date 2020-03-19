const lodash = require('lodash');
const { User, validate } = require('../models/User');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
//const asyncMiddleware = require('../middleware/async');
const LoggerService = require('../middleware/logger');
const logger = new LoggerService('users');
const mongoose = require('mongoose');

//Get the current user
/* We do not allow to get the id directly from the user to avoid them sending someone
 else's id and get hold of unauthorized information. Therefore, we get the user id from the token.
*/
router.get('/me', [auth], async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('-password');//Do not show password.
    if (user) return res.send(user);
    logger.info('You are not authorized to access this resource', req.user._id);
    return res.status(401).send('You are not authorized to access this resource!');
});
router.get('/', [auth], async (req, res) => {
    const users = await User.find().select({ name: 1, email: 1, isAdmin: 1 });//Do not show passwords
    if (users && users.length > 0) return res.send(users);
    logger.info('No users found!');
    return res.status(404).send('Nothing found!')
});
router.delete('/:id', [auth, admin], async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user) return res.send(lodash.pick(user, ['id', 'name', 'email', 'isAdmin']));
    return res.send(`User with id: ${req.params.id} could not be deleted! Invalid User id.`);
});

router.put('/:id', [auth, admin], async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        logger.error('Invalid User id!', req.params);
        return res.status(400).send('Invalid user Id!')
    };
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).send(`No user found with id: ${req.params.id}.`);
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;
    const salt = await bcrypt.genSalt(10);//10 is a salt. The bigger the number, the greater the time it takes to generate salt and the harder is the passwrod to crack
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    const token = user.generateAuthToken();
    if (user && token) {
        logger.info('The data of this user has been edited, and token has been issued!', { "email": user.email, "name": user.name });
        const userObjWithoutPassword = lodash.pick(user, ['id', 'name', 'email', 'isAdmin']);
        return res.header('x-auth-token', token).send(userObjWithoutPassword);//Do not print the  password. Just print id name and email of the user on the GUI
    }
    logger.error('The user could not be edited!', req.body);
    return res.status(500).send('The user could not be edited!  Something went wrong!');
});
//Create a new User
router.post('/', [auth, admin], async (req, res) => {
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
    user = new User(lodash.pick(req.body, ['name', 'email', 'password', 'isAdmin']));
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
    if (user && token) {
        logger.info('New user created and token issued!', { "email": user.email, "name": user.name });
        const userObjWithoutPassword = lodash.pick(user, ['id', 'name', 'email', 'isAdmin']);
        return res.header('x-auth-token', token).send(userObjWithoutPassword);//Do not print the  password. Just print id name and email of the user on the GUI
    }
    logger.error('New user could not be created!', req.body);
    return res.status(500).send('New user could not be created!  Something went wrong!');
});

module.exports = router;
