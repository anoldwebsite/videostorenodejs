const { Customer, validate } = require('../models/Customer');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

//Get all the customers from the database
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort('name');
    if (customers) res.send(customers);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

//Get a customer with a given id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (customer) res.send(customer);
    else
      res
        .status(400)
        .send(
          `Customer with id: $${req.params.id} was NOT found as this id gave: ${modifiedCustomer}`
        );
  } catch (error) {
    res
      .status(400)
      .send(
        `Your supplied id: ${req.params.id} does not exist in the database! ${error.message}`
      );
  }
});

//Edit an existing customer's data
//The 2nd argument is a middleware that checks the authorization of this user who is trying to edit the data.
//The 3rd argument is also a middleware, a route-handler in this case.
router.put('/:id', [auth, admin], async (req, res) => {
  const error = validate(req.body);
  if (error)
    return res
      .status(400)
      .send(
        'The customer could not be updated probably due to non-conformity of the customer with the schema!'
      );
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        phone: req.body.phone,
        isGold: req.body.isGold
      },
      {
        //omitUndefined set to true, so if some of the values are undefined, then keep what is already stored in database
        omitUndefined: true,
        new: true, //Show the updated customer
        runValidators: true //Validate the new object before updating
      }
    );
    if (customer) res.send(customer);
    else
      res
        .status(400)
        .send(
          `Customer with id: $${req.params.id} was NOT updated as this id gave: ${customer}`
        );
  } catch (error) {
    res
      .status(400)
      .send(
        `Customer with id: ${req.params.id} was NOT updated! ${error.message}`
      );
  }
});

//Create a new customer in the database
//The 2nd argument is a middleware that checks the authorization of this user who is trying to post.
//The 3rd argument is also a middleware, a route-handler in this case.
router.post('/', [auth, admin], async (req, res) => {
  const error = validate(req.body);
  if (error) return res.status(400).send('A new customer could not be created probably due to non-conformity of the customer with the schema!');

  const customer = new Customer({
    name: req.body.name,
    phone: req.body.phone,
    isGold: req.body.isGold,
    numberOfMoviesRented: req.body.numberOfMoviesRented,
    pendingTransactions: req.body.pendingTransactions
  });
  try {
    await customer.save();
    if (customer) res.send(customer);
    else res.status(400).send(err.message);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
//Delete the customer with a given id
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (customer)
      res.send(`The customer with the following data was deleted: ${customer}`);
    else
      res
        .status(400)
        .send(
          `Customer with id: ${req.params.id} was not found! The database returned ${customer}.`
        );
  } catch (error) {
    res
      .status(404)
      .send(
        `Customer with id: ${req.params.id} was not deleted! ${error.message}`
      );
  }
});

//Deleting all customers at one go
router.delete('/', [auth, admin], async (req, res) => {
  try {
    const customers = await Customer.deleteMany({});
    if (customers)
      res.send(
        `Number of Customers in the database: ${obj.n} Number of Customers Deleted: ${obj.deletedCount}`
      );
    else
      res
        .status(400)
        .send(
          `No customers were deleted! The request for deletion of all customers returned ${customers}`
        );
  } catch (error) {
    res.status(400).send(`The customers were NOT deleted. ${error.message}`);
  }
});

module.exports = router;
