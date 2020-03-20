
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const validate = require('../middleware/validate');
const Joi = require('@hapi/joi');
const passwordComplexity = require('joi-password-complexity');
//const asyncMiddleware = require('../middleware/async');

const LoggerService = require('../middleware/logger');
const logger = new LoggerService('auth');

router.post('/', validate(validateAuthorization), async (req, res) => {
    //throw new Error();
    //const error = validateAuthorization(req.body);
    //if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne(
        {
            email: req.body.email
        }
    );

    if (!user) {
        //TODO: The meta prop in the MongoDB is always set to Null.
        //throw new Error('Invalid email');
        logger.error('Invalid Email', { "email": req.body.email });
        return res.status(400).send('Invalid email or password!');//Better for security not to tell exactly which one of email of password is invalid.
    }
    //req.body.password has plain text password whereas user.password has hashed text password which includes the salt. 
    const validPassword = await bcrypt.compare(req.body.password, user.password)
    if (!validPassword) {
        //throw new Error('Invalid password');
        logger.error('Invalid Password', { "password": req.body.password });
        return res.status(400).send('Invalid email or password');
    }
    //Valid user. Return a json web token (jwt)
    const token = user.generateAuthToken();
    if (token) {
        logger.info('token issued', token);
        return res.send(token);
    }
});

function validateAuthorization(userDetails) {//userDetails is same as req.body
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
    //console.log(schema.validate(userDetails));
    return schema.validate(userDetails);
};

module.exports = router;