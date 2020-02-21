const { User } = require('../../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const mongoose = require('mongoose');

//A test suite is a container for multiple tests. describe is a test suite.
describe('User.generateAuthToken', () => {
    it('should return a valid json web token (JWT)', () => {
        //We need the const payload below to store the id that we create by calling new mongoose.Types.ObjectId
        /* 
        The const payload does not store the _id in hexadecimal as we see in the MongoDB. It stores it as a real id which is 
        different from the hexadecimal version (type string) that we see. So, we need to convert it to String by using toHexString() method.
        */
        const payload = {
            _id: new mongoose.Types.ObjectId().toHexString(),
            isAdmin: true
        }
        const user = new User(payload);
        const token = user.generateAuthToken();
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        expect(decoded).toMatchObject(payload);//The decoded json web token should match the payload.
    });
});