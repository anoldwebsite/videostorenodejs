//Use NODE_ENV=test npm test --runInBand to run tests if you get errors with npm test 
/*
We will write a unit test for the function in auth.js to make sure that if the client sends a valid json web token, as in the test above, 
    then the req.user in auth.js will be populated with the payload of the json web token.
*/
const { User } = require('../../../models/User');//Load the User module.
const auth = require('../../../middleware/auth');
const mongoose = require('mongoose');

describe('auth middleware', () => {
    it('should populate req.user with the payload of a valid JWT', () => {
        const user = {
            _id: mongoose.Types.ObjectId().toHexString(),
            isAdmin: true
        }
        const token = new User(user).generateAuthToken();
        //supertest package has res but no req object. 
        //mock req instead of : const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        //Our mock req object should have a method called header because in the auth.js we have : const token = req.header('x-auth-token');//Get the token from the header.
        const req = {
            header: jest.fn().mockReturnValue(token)//Using jest to mock the process of returning a token in the header in the request object of the http module.
        };
        //mock res
        const res = {}; //We don't need anything inside res object here but we need a res object to pass to the auth function.
        //mock next 
        const next = jest.fn();

        auth(req, res, next);
        //expect(req.user).toBeDefined();//This is not enough.
        expect(req.user).toMatchObject(user);//Use .toMatchObject to check that a JavaScript object matches a subset of the properties of an object.
    });
});