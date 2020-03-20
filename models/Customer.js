const mongooose = require('mongoose');
const Joi = require('@hapi/joi'); //The most powerful schema description language and data validator for JavaScript. https://hapi.dev/family/joi/

//Create a new Schema for the Customer class.
const customerSchema = mongooose.Schema({
  isGold: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    minlength: 10,
    maxlength: 10,
    required: true,
    validate: {
      validator: function (v) {
        const pattern = /^\d{10}$/;
        return v == null || v.trim().length < 1 || pattern.test(v);
      },
      message: 'Telephone number is not valid.'
    }
  },
  name: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 50,
    validate: {
      validator: function (v) {
        /*
                        Special Characters & digits are Not Allowed.
                        Spaces are only allowed between two words.
                        Only one space is allowed between two words.
                        Spaces at the start or at the end are consider to be invalid.
                    */
        //const pattern = /^[a-zA-z]+([\s][a-zA-Z]+)*$/ //Single word name is valid
        const pattern = /^[a-zA-z]+([\s][a-zA-Z]+)+$/; //Single word name as Dilshad is not valid but Dilshad Rana is valid
        return v == null || v.trim().length < 1 || pattern.test(v);
      },
      message:
        'Special character and digits are not allowed. Only once space is allowed between words. Single word name is not valid. No spaces in the beginning or at the end.'
    }
  },
  numberOfMoviesRented: {
    type: Number,
    min: 0,
    max: 10
  },
  pendingTransactions: []
});

//Compiling the schema to get a class Customer
const Customer = mongooose.model('Customer', customerSchema);

function validateCustomer(customerObject) {//customer is same he
  const schema = Joi.object({
    name: Joi.string()
      .min(4)
      .max(50),
    phone: Joi.string()
      .min(10)
      .max(13),
    isGold: Joi.boolean(),
    numberOfMoviesRented: Joi.number().min(0).max(10),
    pendingTransactions: Joi.array()
  });
  return schema.validate(customerObject); //Destructuring
  //const { error, value } = schema.validate(genre);//Destructuring
  //If the input is valid then the error is undefined.
}

module.exports.Customer = Customer;
module.exports.validateCustomer = validateCustomer;
