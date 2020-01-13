const { Customer, validate } = require('../models/Customer');
const mongooose = require('mongoose');
const express = require('express');
const router = express.Router();

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

     const error = validate(req.body);
     if(error) return res.status(400).send("The customer could not be updated probably due to non-conformity of the customer with the schema!");

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

    const error = validate(req.body);
    if(error) return res.status(400).send("A new customer could not be created probably due to non-conformity of the customer with the schema!");

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
        .catch(err => res.status(400).send(`The customers were not deleted. ${err.message}`));
});

module.exports = router;