const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const Joi = require('@hapi/joi');
const passwordComplexity = require('joi-password-complexity');
//const asyncMiddleware = require('../middleware/async');

router.post('/', async (req, res) => {
    const error = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne(
        {
            email: req.body.email
        }
    );

    if (!user) return res.status(400).send('Invalid email or password!');//Better for security not to tell exactly which one of email of password is invalid.
    //req.body.password has plain text password whereas user.password has hashed text password which includes the salt. 
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if (!validPassword) return res.status(400).send('Invalid email or password');
    //Valid user. Return a json web token (jwt)
    const token = user.generateAuthToken();
    if (token) return res.send(token);
});

function validate(user) {
    const complexityOptions = {
        min: 8,
        max: 255,
        lowerCase: 1,
        upperCase: 1,
        numeric: 1,
        symbol: 1,
        requirementCount: 4,/* This count does not include min and max. Only lowerCase, upperCAse, numeric and symbol are considered. If requirementCount = 0, then it takes count as 4. */
    };
    //passwordComplexity(complexityOptions).validate(user.password);
    const schema = Joi.object(
        {
            email: Joi.string().min(5).max(255).required().email(),
            //password: Joi.string().min(8).max(255).required()
            password: passwordComplexity(complexityOptions)
        }
    );
    const { error } = schema.validate(user)
    return error;
};//function validate which validates the creation of a new user ends here.

module.exports = router;