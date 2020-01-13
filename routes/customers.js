const mongooose = require('mongoose');
const express = require('express');
const Joi = require('@hapi/joi');//The most powerful schema description language and data validator for JavaScript. https://hapi.dev/family/joi/ 
const router = express.Router();

//Create a new Schema for the Customer class.
const customerSchema = mongooose.Schema(
    {
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
                    return (v == null || v.trim().length < 1) || pattern.test(v);
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
                    return (v == null || v.trim().length < 1) || pattern.test(v);
                },
                message: 'Special character and digits are not allowed. Only once space is allowed between words. Single word name is not valid. No spaces in the beginning or at the end.'
            }
        }
    }
);

//Compiling the schema to get a class Customer
const Customer = mongooose.model('Customer', customerSchema);

//Get all the customers from the database
router.get('/', async (req, res) => {
    const customers = await Customer.find().sort('name');
    if (customers) res.send(customers);
});

//Get a customer with a given id
router.get('/:id', (req, res) => {
    Customer.findById(req.params.id)
        .then(customerRetrieved => res.send(customerRetrieved))
        .catch(err => res.status(400).send(`Your supplied id: ${req.params.id} does not exist in the database! ${err.message}`));
});
/* 
//Works with a valid id but with an invalid id, throws error on console and doesn't show anything in postaman or insomnia.
router.get('/:id', async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    console.log(customer);
    if(!customer) return res.status(404).send(`Customer with id: ${req.params.id} does not exist!`);
    res.send(customer);
}); */

//Edit an existing customer's data
router.put('/:id', (req, res) => {
    Customer.findByIdAndUpdate(req.params.id,
        {
            name: req.body.name,
            phone: req.body.phone,
            isGold: req.body.isGold,
        },
        {
            //omitUndefined set to true, so if some of the values are undefined, then keep what is already stored in database
            omitUndefined: true,
            new: true, //Show the updated customer
            runValidators: true //Validate the new object before updating
        }
    )
        .then(modifiedCustomer => res.send(modifiedCustomer))
        .catch(err => res.status(400).send(`Customer with id: ${req.params.id} was not updated, if it exists! ${err.message}`));
});

//Create a new customer in the database
router.post('/', (req, res) => {
    let customer = new Customer(
        {
            name: req.body.name,
            phone: req.body.phone,
            isGold: req.body.isGold
        }
    );
    customer.save()
        .then(customer => res.send(customer))
        .catch(err => res.status(400).send(err.message));
});

//Delete the customer with a given id
router.delete('/:id', (req, res) => {
    Customer.findByIdAndDelete(req.params.id)
        .then(deletedCustomer => res.send(`The customer with the following data was deleted: ${deletedCustomer}`))
        .catch(err => res.status(404).send(`Customer with id: ${req.params.id} was not deleted! ${err.message}`));
});
//Deleting all customers at one go
router.delete('/', (req, res) => {
    Customer.deleteMany({})
        .then(obj => res.send(`Number of Customers in the database: ${obj.n} Number of Customers Deleted: ${obj.deletedCount}`))
        .catch(err => res.status(400).send("The customers were not deleted."));
});

module.exports = router;