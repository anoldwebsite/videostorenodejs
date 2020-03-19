
//const validateObjectId = require('../middleware/validateObjectId');
//const moment = require('moment');
const Joi = require('@hapi/joi');
const validate = require('../middleware/validate');
const { Rental } = require('../models/Rental');
const { Movie } = require('../models/Movie');
const auth = require('../middleware/auth');
const express = require('express');
const router = express.Router();

router.post('/', [auth, validate(validateReturn)], async (req, res) => {
    /* The work done by the following two lines has been refactored to function validate() in file validate.js in the middleware folder.
    //if (!req.body.customerId) return res.status(400).send('customerId not provided');//should return 400 if customerId is not provided.
    //if (!req.body.movieId) return res.status(400).send('movieId not provided');//should return 400 if movieId is not provided.
    */

    /* The work done by the code in the line below is now in the function auth in auth.js in the middleware folder.
    //res.status(401).send('Unauthorized');//should return 401 if client is not logged in. 
    */
    //should return 404 if no rental is found for this return
    /*     const rental = await Rental.findOne(
            {
                'customer._id': req.body.customerId,
                'movie._id': req.body.movieId,
                'rentalType': req.body.rentalType
            }
        ); */
    //const rental = await Rental.lookup(req.body.customerId, req.body.movieId, req.body.rentalType);
    const rental = await Rental.lookup(req.body.customerId, req.body.movieId);
    //console.log(` =======================================> ${rental}`);
    if (!rental) return res.status(404).send('Rental not found!');

    if (rental.dateReturned) return res.status(400).send(`Return for this rental already processed! The movie was returned on ${rental.dateReturned} .`);

    rental.calculateRentalFee();
    await rental.save();
    //Update the stock after the return of this product/movie.
    await Movie.update(
        { _id: rental.movie._id }, //Criteria for searching the movie here is the id of the movie.
        { $inc: { numberInStock: 1 } } //The property to update
    );

    return res.send(rental);
    //const error = validateRental(req.body);
    //if(error) return res.status(400).send(error.details[0].message);
});

function validateReturn(movieReturnObject) {
    //console.log(movieReturnObject); //movieReturnObject is the same as req.body
    const schema = Joi.object(
        {
            customerId: Joi.objectId().required(),
            movieId: Joi.objectId().required(),
            rentalType: Joi.string().required()
        }
    );
    return schema.validate(movieReturnObject);
}

module.exports = router;