const Joi = require('@hapi/joi');

module.exports = function () {

    //Joi.objectId is a mthod on this Joi object. The result of require('joi-objectid') is a function, so we will pass Joi as parameter to this function.
    Joi.objectId = require('joi-objectid')(Joi);

};
