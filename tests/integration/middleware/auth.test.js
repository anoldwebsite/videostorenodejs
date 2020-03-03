//auth.test.js (integration test)
const request = require('supertest');
const { Genre } = require('../../../models/Genre');
const { User } = require('../../../models/User');

let server;

describe('auth middleware', () => {
    let admin = false;//Set to true if you want the user to be admin.
    let token;
    const generateToken = () => {
        return new User(
            {
                name: 'Dilshad Rana',
                email: 'somemeail@yahoo.ca',
                password: 'Somepassword2020?',
                isAdmin: admin
            }
        ).generateAuthToken();
    }
    const exec = () => {
        return request(server).post('/api/genres').set('x-auth-token', token).send({ name: 'Genre One' });//token is converted to string.
    };
    beforeEach(() => {
        server =  require('../../../index');
    });
    afterEach(async () => {
        await Genre.deleteMany({});//Reset the collection Genre by deleteing all documents for the next test.
        server.close();//Asks the server to stop accepting new connections but the current connection is still there untill it is not needed anymore.
    });

    it('should return 401 if no token is provided', async () => {
        //admin = true; //This line and the next commented line is needed for generating a valid token for a user that has admin rights.
        //token = await generateToken();//This line and the above commented line is needed for generating a valid token for a user that has admin rights.
        token = '';
        //token = null;//token = null will fail the test because null is converted to string 'null' by .set('x-auth-token', token);
        const res = await exec();
        expect(res.status).toBe(401);
    });
    it('should return 400 if token is invalid', async () => {
        //admin = true; //This line and the next commented line is needed for generating a valid token for a user that has admin rights.
        //token = await generateToken();//This line and the above commented line is needed for generating a valid token for a user that has admin rights.
        token = 'a';//invalid token
        const res = await exec();
        expect(res.status).toBe(400);
    });


    it('should return 200 if valid token is passed', async () => {
        //In this app, one must be an admin to be able to post a genre, which we are doing: request(server).post('/api/genres').set('x-auth-token', token).send({ name: 'Genre One' });
        admin = true; //This line and the next commented line is needed for generating a valid token for a user that has admin rights.
        token = await generateToken();//This line and the above commented line is needed for generating a valid token for a user that has admin rights.
        const res = await exec();
        expect(res.status).toBe(200); 
    });
    /*
    We will write a unit test for the function in auth.js to make sure that if the client sends a valid json web token, as in the test above, 
    then the req.user in auth.js will be populated with the payload of the json web token. Since this module is for integration testing, so go
    to the module auth.test.js in the middleware folder inside the unit folder.
    */
});