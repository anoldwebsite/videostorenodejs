const { Customer, validateCustomer } = require('../models/Customer');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const admin = require('../middleware/admin');
//const asyncMiddleware = require('../middleware/async');
const LoggerService = require('../middleware/logger');
const logger = new LoggerService('customers');
const mongoose = require('mongoose');
const validateObjectId = require('../middleware/validateObjectId');

//Get all the customers from the database
router.get('/', async (req, res) => {
  const customers = await Customer.find().sort('name');
  if (customers) return res.send(customers);
  logger.info('No customers found!', req.body);
  return res.status(400).send('No customers found!');
});

//Get a customer with a given id
router.get('/:id', validateObjectId, async (req, res) => {
  //if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send('Invalid id');
  const customer = await Customer.findById(req.params.id);
  if (customer) return res.send(customer);
  logger.info(`Customer with id: $${req.params.id} was NOT found!`, req.params.id);
  return res.status(404).send(`Customer with id: $${req.params.id} was NOT found!`);
});

//Edit an existing customer's data
//The 2nd argument is a middleware that checks the authorization of this user who is trying to edit the data.
//The 3rd argument is also a middleware, a route-handler in this case.
router.put('/:id', validateObjectId, [auth, admin, validate(validateCustomer)], async (req, res) => {
  //const error = validateCustomer(req.body);
  //if (error) return res.status(400).send('The customer could not be updated probably due to non-conformity of the customer with the schema!');
  //if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send(`Invalid Customer id: ${req.params.id}`);
  const customerExists = await Customer.findById(req.params.id);
  if (!customerExists) return res.status(404).send(`Invalid Customer id: ${req.params.id}`);
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      phone: req.body.phone,
      isGold: req.body.isGold,
      numberOfMoviesRented: req.body.numberOfMoviesRented
    },
    {
      //omitUndefined set to true, so if some of the values are undefined, then keep what is already stored in database
      omitUndefined: true,
      new: true, //Show the updated customer
      runValidators: true //Validate the new object before updating
    }
  );
  if (customer) return res.send(customer);
  logger.info('Customer could not be updated!', { "You entered Customer id:": req.params.id });
  return res.status(400).send(`Customer with id: $${req.params.id} was NOT updated as this id gave: ${customer}`);
});

//Create a new customer in the database
//The 2nd argument is a middleware that checks the authorization of this user who is trying to post.
//The 3rd argument is also a middleware, a route-handler in this case.
router.post('/', [auth, admin, validate(validateCustomer)], async (req, res) => {
  //router.post('/', [auth, admin, validate(validateCustomer), validateObjectId], async (req, res) => {
  //const error = validateCustomer(req.body);
  //if (error) return res.status(400).send('A new customer could not be created probably due to non-conformity of the customer with the schema!');

  const customer = new Customer({
    name: req.body.name,
    phone: req.body.phone,
    isGold: req.body.isGold,
    numberOfMoviesRented: req.body.numberOfMoviesRented,
    pendingTransactions: req.body.pendingTransactions
  });
  await customer.save();
  if (customer) return res.send(customer);
  logger.info('New customer could not be created.', { "customer id:": req.body });
  return res.status(400).send(err.message);
});

//Delete the customer with a given id
router.delete('/:id', validateObjectId, [auth, admin], async (req, res) => {
  //if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).send(`Customer id is not of mongoose type: ${req.params.id}`);
  const customerExists = await Customer.findById(req.params.id);
  if (!customerExists) return res.status(404).send(`Invalid customer id: ${req.params.id}`);

  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (customer) return res.status(200).send(customer);
  logger.info('The customer could not be deleted.', { "customer id:": req.params.id });
  return res.status(400).send(`Customer with id: ${req.params.id} was not found! The database returned ${customer}.`);
});

//Deleting all customers at one go
router.delete('/', [auth, admin], async (req, res) => {
  const customers = await Customer.deleteMany({});
  if (customers) return res.send(`Number of Customers in the database: ${customers.n} Number of Customers Deleted: ${customers.deletedCount}`);
  logger.info('No customers were deleted!');
  return res.status(400).send(`No customers were deleted! The request for deletion of all customers returned ${customers}`);
});

module.exports = router;
