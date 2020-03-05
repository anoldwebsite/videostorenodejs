const request = require('supertest');
const { Customer } = require('../../../models/Customer');
const { User } = require('../../../models/User');
const mongoose = require('mongoose');

let server;

describe('/api/customers', () => {
    beforeEach(() => {
        server = require('../../../index');
    });
    afterEach(async () => {
        server.close();//Ask the server to stop accepting new connections. 
        await Customer.deleteMany({});
    });
    describe('GET /', () => {
        it('should return all customers', async () => {
            await Customer.insertMany(
                [
                    { name: "Dilshad Rana", phone: "3430984987" },
                    { name: "Mota Saheb", phone: "8945980312" }
                ]
            );
            const res = await request(server).get('/api/customers');
            expect(res.status).toBe(200);
            expect(res.body.some(g => g.name === 'Dilshad Rana')).toBeTruthy();
            expect(res.body.some(g => g.name === 'Mota Saheb')).toBeTruthy();
        });
        it('should return a customer if a valid id is passed', async () => {
            const customer = new Customer({ name: "Dilshad Rana", phone: "3430984987" });
            await customer.save();
            const res = await request(server).get('/api/customers/' + customer._id.toHexString());
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', customer.name);
            expect(res.body).toHaveProperty('_id', customer._id.toString());
        });
        it('should return 404 if invalid id is passed', async () => {
            const res = await request(server).get('/api/customers/1');
            expect(res.status).toBe(404);
        });
        it('should return 404 if no customer with a given id exists', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get('/api/customers/' + id);
            expect(res.status).toBe(404);
        });
    });
    describe('POST /', () => {
        let admin, id, token;
        const generateToken = () => {
            return new User(
                {
                    name: 'Dilshad Rana',
                    email: 'somemail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: admin//true for admin rights, false for non-admin user.
                }
            ).generateAuthToken();
        };

        beforeEach(async () => {
            admin = true;
            token = await generateToken();
        });

        const exec = () => {
            return request(server)
                .post('/api/customers')
                .set('x-auth-token', token)
                .send({ name: "Dilshad Rana", phone: "3430984987" });
        };
        it('should return 401, if client is not logged in', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 403, if client is logged in but not admin', async () => {
            admin = false;
            token = generateToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });
        it('should have the customer if valid input is given', async () => {
            await exec();
            const customer = await Customer.find({ name: 'Dilshad Rana' });
            expect(customer).not.toBeNull();
        });
        it('should return the customer if it is valid', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'Dilshad Rana');
        });
        it('should return 400, if customer name is less than 4 characters', async () => {
            const res = await request(server).post('/api/customers').set('x-auth-token', token).send({ name: "Sha", phone: "3430984987" });
            expect(res.status).toBe(400);
        });
        it('should return 400, if customer name is greater than 50 characters', async () => {
            const longName = new Array(52).join('D');
            const res = await request(server).post('/api/customers').set('x-auth-token', token).send({ name: longName, phone: "3430984987" });
            expect(res.status).toBe(400);
        });
        it('should return 400, if customer phone number is less than 10 characters', async () => {
            const res = await request(server).post('/api/customers').set('x-auth-token', token).send({ name: "Dilshad Rana", phone: "123456789" });
            expect(res.status).toBe(400);
        });
        it('should return 400, if customer phone number is greater than 10 characters', async () => {
            const res = await request(server).post('/api/customers').set('x-auth-token', token).send({ name: "Dilshad Rana", phone: "12345678901233" });
            expect(res.status).toBe(400);
        });
    });
    describe('PUT /:id', () => {
        let newName, newPhone, token, id, customer, admin;

        const generateToken = () => {
            return new User(
                {
                    name: 'Dilshad Rana',
                    email: 'somemail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: admin//true for admin rights, false for non-admin user.
                }
            ).generateAuthToken();
        };
        beforeEach(async () => {
            admin = true;
            token = generateToken();
            customer = new Customer({ name: "Dilshad Rana", phone: "3430984987" });
            await customer.save();
            id = customer._id;
            newName = 'Rana Dilshad';
            newPhone = '0123456789'
        });
        const exec = async () => {
            //const token = generateToken();
            return await request(server)
                .put('/api/customers/' + id)
                .set('x-auth-token', token)
                .send({ name: newName, phone: newPhone });
        };
        it('should return 401 if client is not logged in', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 400 if customer name is less than 4 characters', async () => {
            newName = "Ran";
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if phone number is less than 10 characters', async () => {
            newPhone = "123";
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if customer name is greater than 50 characters', async () => {
            newName = new Array(52).join('D');
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400 if phone number is greater than 10 characters', async () => {
            newPhone = "12345678910111213";
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 404 if customer id is invalid', async () => {
            id = 1;//invalid customer id
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if customer is not found for a given id', async () => {
            id = mongoose.Types.ObjectId();//Valid but non-existing in DB customer id
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should update the customer if input is valid', async () => {
            await exec();
            const updatedCustomer = await Customer.findById(id);
            expect(updatedCustomer.phone).toBe(newPhone);
            expect(updatedCustomer.name).toBe(newName);
        });
        it('should return the update customer if input is valid', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', newName);
            expect(res.body).toHaveProperty('phone', newPhone);
        });
    });
    describe('DELETE /:id', () => {
        let token, id, customer, admin;

        const generateToken = () => {
            return new User(
                {
                    name: 'Dilshad Rana',
                    email: 'somemail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: admin//true for admin rights, false for non-admin user.
                }
            ).generateAuthToken();
        };
        beforeEach(async () => {
            admin = true;
            token = generateToken();
            customer = new Customer({ name: "Dilshad Rana", phone: "3430984987" });
            await customer.save();
            id = customer._id;
        });
        const exec = async () => {
            return await request(server)
                .delete('/api/customers/' + id)
                .set('x-auth-token', token)
                .send();
        };
        it('should delete the csutomer if the input is valid', async () => {
            const res = await exec();
            const deletedCustomer = await Customer.findById(id);
            //console.log(`==========================> ${deletedCustomer}`);
            expect(deletedCustomer).toBeNull();
        });
        it('should return the deleted customer if input is valid', async () => {
            const deletedCustomer = await Customer.findByIdAndDelete(id);
            expect(deletedCustomer).toHaveProperty('_id', id);
            expect(deletedCustomer).toHaveProperty('name', customer.name);
            expect(deletedCustomer).toHaveProperty('phone', customer.phone);
        });
        it('should should return 401 if client is not logged in', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 403 if client is logged in but not admin', async () => {
            admin = false;
            token = generateToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });
        it('should return 404 if the Customer id is invalid', async () => {
            id = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if no customer is found for the given id', async () => {
            id = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
    });
    describe('DELETE /', () => {
        let token, admin;
        const generateToken = () => {
            return new User(
                {
                    name: 'Dilshad Rana',
                    email: 'somemail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: admin//true for admin rights, false for non-admin user.
                }
            ).generateAuthToken();
        };
        beforeEach(async () => {
            await Customer.collection.insertMany(
                [
                    { name: "Dilshad Rana", phone: "3430984987" },
                    { name: "Rana Dilshad", phone: "1234567890" },
                    { name: "Motoo Saheb", phone: "0123456789" }
                ]
            );
            admin = true;
            token = generateToken();
        });
        it('should delete all the csutomers if the input is valid', async () => {
            await request(server).delete('/api/customers').set('x-auth-token', token).send();
            const customers = await Customer.find({});
            expect(customers.length).toBe(0);
        });
        it('should return the number of customers deleted if the input is valid', async () => {
            const res = await request(server).delete('/api/customers').set('x-auth-token', token).send();
            //console.log(res.text)
            expect(res.text).toMatch(/3/);
        });
    });
});