//auth.test.js (integration test)
const request = require('supertest');
const { Genre } = require('../../../models/Genre');
const { User } = require('../../../models/User');
const bcrypt = require('bcrypt');
let server;

describe('Checking Authorization', () => {
    beforeEach(() => {
        server = require('../../../index');
    });
    afterEach(async () => {
        await User.deleteMany({});
        await Genre.deleteMany({});//Reset the collection Genre by deleteing all documents for the next test.
        server.close();//Asks the server to stop accepting new connections but the current connection is still there untill it is not needed anymore.
    });

    describe('POST /', () => {
        beforeEach(async () => {
            const user = new User(
                {
                    name: 'Mota Rana',
                    email: 'mota.mail@yahoo.com',
                    password: 'Somepassword2020?',
                    isAdmin: false
                }
            );
            const salt = await bcrypt.genSalt(10);//10 is a salt. The bigger the number, the greater the time it takes to generate salt and the harder is the passwrod to crack
            user.password = await bcrypt.hash(user.password, salt);
            await user.save();
        });
        it('should return 200 with valid input', async () => {
            const res = await request(server).post('/api/auth').send({ email: 'mota.mail@yahoo.com', password: 'Somepassword2020?' });
            expect(res.status).toBe(200);
            expect(res.body).not.toBeNull();
        });
        it('should return 400 with non-existing email input', async () => {
            const res = await request(server).post('/api/auth').send({ email: 'nonExistingEmail@yahoo.com', password: 'Somepassword2020?' });
            expect(res.status).toBe(400);
        });
        it('should return 400 with wrong passwrod input', async () => {
            const res = await request(server).post('/api/auth').send({ email: 'mota.mail@yahoo.com', password: 'SomeWRONGpassword2020?' });
            expect(res.status).toBe(400);
        });
        it('should return 400 with email length minimum than 5 characters input', async () => {
            const res = await request(server).post('/api/auth').send({ email: '@y.c', password: 'SomeWRONGpassword2020?' });
            expect(res.status).toBe(400);
        });
        it('should return 400 with email more than 255 characters input', async () => {
            let longEmail = (new Array(124).join('Mo')) + '@gmail.com';//More than 255 characters.//256 characters.
            const res = await request(server).post('/api/auth').send({ email: longEmail, password: 'SomeWRONGpassword2020?' });
            expect(res.status).toBe(400);
        });
        it('should return 400 with password less than 8 characters input', async () => {
            const res = await request(server).post('/api/auth').send({ email: 'mota.mail@yahoo.com', password: 'Pd2020?' });
            expect(res.status).toBe(400); 
        });
        it('should return 400 with password less than 8 characters input', async () => {
            let longPassword = (new Array(124).join('Mo')) + 'Uuuuuuu???';//More than 255 characters.//256 characters.
            const res = await request(server).post('/api/auth').send({ email: 'mota.mail@yahoo.com', password: longPassword });
            expect(res.status).toBe(400);
        });
        it('should return 400 with no uppercase in the password input', async () => {
            const res = await request(server).post('/api/auth').send({ email: 'mota.mail@yahoo.com', password: 'somepassword2020?' });
            expect(res.status).toBe(400);
        });
        it('should return 400 with no lowercase in the password input', async () => {
            const res = await request(server).post('/api/auth').send({ email: 'mota.mail@yahoo.com', password: 'SOMEPASSWORD2020?' });
            expect(res.status).toBe(400);
        });
        it('should return 400 with no digit in the password input', async () => {
            const res = await request(server).post('/api/auth').send({ email: 'mota.mail@yahoo.com', password: 'SomepasswordSSSS?' });
            expect(res.status).toBe(400);
        });
        it('should return 400 with no special symbol in the password input', async () => {
            const res = await request(server).post('/api/auth').send({ email: 'mota.mail@yahoo.com', password: 'Somepassword20202' });
            expect(res.status).toBe(400);
        });
    });
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
        const exec = async () => {
            return await request(server).post('/api/genres').set('x-auth-token', token).send({ name: 'Genre One' });//token is converted to string.
        };

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
            token = generateToken();//This line and the above commented line is needed for generating a valid token for a user that has admin rights.
            const res = await exec();
            expect(res.status).toBe(200);
        });
        /*
        We will write a unit test for the function in auth.js to make sure that if the client sends a valid json web token, as in the test above, 
        then the req.user in auth.js will be populated with the payload of the json web token. Since this module is for integration testing, so go
        to the module auth.test.js in the middleware folder inside the unit folder.
        */
    });
});