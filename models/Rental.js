const Joi = require('@hapi/joi');
const mongoose = require('mongoose');
const moment = require('moment');
/*
We are not using schema from the Customer.js here as a customer in that schema might have e.g., 50 properties
and we do not need them for Rental class. We are interested in a few properties, so we are defining
a schema for a customer who rents a movie here using new mongoose.Schema
*/

const rentalSchema = new mongoose.Schema(
  {
    customer: {
      type: new mongoose.Schema({
        name: {
          type: String,
          required: true,
          minlength: 2,
          maxlength: 50
        },
        isGold: {
          type: Boolean,
          default: false//Does not work. Always sets to false if not taken value from req.body.isGold
        },
        phone: {
          type: String,
          required: true,
          minlength: 5,
          maxlength: 50
        }
      }),
      required: true,
      pendingTransactions: []
    },
    movie: {
      type: new mongoose.Schema({
        title: {
          type: String,
          required: true,
          trim: true,
          minlength: 5,
          maxlength: 255
        },
        dailyRentalRate: {
          type: Number,
          required: true,
          min: 0,
          max: 255
        }
      }),
      required: true,
      pendingTransactions: []
    },
    dateOut: {
      type: Date,
      required: true,
      default: Date.now
    },
    dateReturned: {
      type: Date //We can not set required to true or default date as during the creation of Rental Class or an instance of Rental we do not have this field set. This field is set when a customer returns the movie.
    },
    rentalType: {
      type: String,
      required: true,
      enum: ['borrow', 'return'],
      //default: 'borrow',
      lowercase: true,
      trim: true
    },
    rentalFee: {
      type: Number,
      min: 0
    }
  }
);

//rentalSchema.statics.lookup = function (customerId, movieId, rentalType) {
rentalSchema.statics.lookup = function (customerId, movieId) {
  return this.findOne(
    {
      'customer._id': customerId,
      'movie._id': movieId,
      //'rentalType': rentalType
    }
  );
}

rentalSchema.methods.calculateRentalFee = function () {
  this.dateReturned = new Date();
  const rentalDays = moment().diff(this.dateOut, 'days');//Calculates the number of days the movies was rented for.
  this.rentalFee = rentalDays * this.movie.dailyRentalRate;
}

const Rental = mongoose.model('Rental', rentalSchema);

function validateRental(rental) {
  //rental is the same as req.body
  const schema = Joi.object({
    customerId: Joi.objectId().required(),
    movieId: Joi.objectId().required()
    //rentalType: Joi.string().required()
  });
  const { error } = schema.validate(rental);
  return error;
}

module.exports.Rental = Rental;
module.exports.validateRental = validateRental;
