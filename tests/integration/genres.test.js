
const request = require('supertest');
const { Genre } = require('../../models/Genre');
const { User } = require('../../models/User');
/* const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);//https://mongoosejs.com/docs/deprecations.html
mongoose.set('useCreateIndex', true);

const config = require('config'); */
/*
 const server = require('./startup/logging');
 The problem with the approach in the line above is that when we load the server, it is loaded at port 3000. After running the jest,
 and then making some changes to our code, jest will re-run the tests. This will load the server again on port 3000 which is already busy
 due to one instance of server already running on that port. Therefore, we will start and stop the server before and each test using 
 beforeEach and afterEach utility functions in the jasmin and jest.
*/

let server;

//Test suit for the route /api/genres
describe('/api/genres', () => {
    //Test suit for getting all genres
    beforeEach(() => { server = require('../../index'); });//Opern the server before each test.

    afterEach(async () => {
        await server.close();
        await Genre.deleteMany({});//await Genre.remove({});//deprecated. USe deleteMany();
    });//shut down the connection with the server after each test.

    //afterAll(() => setTimeout(() => process.exit(), 1000));
    //afterAll(() => { app.close() });
    //afterAll(() => { process.kill() });
    //afterAll(() => { mongoose.disconnect() });
    //afterAll(() => { mongoose.connection.close() });
    /*     afterAll(() => {
            const db = config.get('db');
            mongoose.disconnect();
            db.disconnect();
            //mongoose.connection.close();
        }); */

    describe('GET /', () => {
        it('should return all genres', async () => {
            await Genre.collection.insertMany(
                [
                    { name: 'Genre One' },
                    { name: 'Genre Two' }
                ]
            );
            const res = await request(server).get('/api/genres');
            expect(res.status).toBe(200);//200 is status code for ok.
            expect(res.body.length).toBe(2);//2 means two Genre objects in the database. res.body retrns an array.
            //console.log(typeof (res.body));//Object
            //console.log(Array.isArray(res.body));//True
            expect(res.body.some(g => g.name === 'Genre One')).toBeTruthy();
            /* (callbackfn: (value: T, index: number, array: readonly T[]) => unknown, thisArg?: any): boolean
                A function that accepts up to three arguments. The some method calls the callbackfn function for each element in the array until the callbackfn returns a value which is coercible to the Boolean value true, or until the end of the array.
                Determines whether the specified callback function returns true for any element of an array.
            */
            expect(res.body.some(g => g.name === 'Genre Two')).toBeTruthy();
        });
    });
    describe('GET /:id', () => {
        it('should return a genre if a valid id is passed', async () => {
            const genre = new Genre({ name: 'Genre One' });//Creating a genre
            await genre.save();//Saving the genre to the MongoDB
            const res = await request(server).get('/api/genres/' + genre._id);
            expect(res.status).toBe(200);
            //expect(res.body).toMatchObject(genre); 
            /* The line above will fail because when mongoose generates property _id but sets it to an ObjectId in the MongoDB, 
            but when we read the object genre from the MongoDB, the id is a string. So, the id generated originally by mongoose is
            what the test expects but the one retrieved from the MongoDB is a string, so there is a diference between the 
            expected and recieved id. Therefore, we will compare the name property of the genre instead. We can also convert the genre._id to string 
            to compare it to the one retrieved from MongoDB. */
            expect(res.body).toHaveProperty('name', genre.name);
            expect(res.body).toHaveProperty('_id', genre._id.toString());
            //console.log(typeof (res.body));//Object
            //console.log(Array.isArray(res.body));
        });
    });
    describe('GET /:id', () => {
        it('should return 404 status code if invalid id is passed.', async () => {
            const res = await request(server).get('/api/genres/1');
            expect(res.status).toBe(404);
        });
    });
    //Tests for router.post('/', [auth, admin], async (req, res) => { ........ }); in the file genres.js
    describe('POST /', () => {
        it('should return 401, if client is not logged in', async () => {
            const res = await request(server).post('/api/genres').send({ name: 'Genre One' });
            expect(res.status).toBe(401);//401 Unauthorized Error indicates that the requested resource is restricted and requires authentication
        });
        it('should return 403, if client is logged in but not admin', async () => {
            //Create a user who is not an admin
            let user = new User(
                {
                    name: 'Dilshad Rana',
                    email: 'someemail@yahoo.com',
                    password: 'Somepassword2020*',
                    isAdmin: false//Change to true to make her admin and fail the test as 200 will be status returned in that case.
                }
            );
            const token = user.generateAuthToken();
            //const token = new User().generateAuthToken();
            const res = await request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Genre One'
                    }
                );
            expect(res.status).toBe(403);
            /* HTTP 403 provides a distinct error case from HTTP 401; while HTTP 401 is returned when the client has not authenticated, and implies that a successful response may be returned following valid authentication, HTTP 403 is returned when the client is not permitted access to the resource despite providing authentication such as insufficient permissions of the authenticated account. */
        });
        it('should return 400, if genre is less than 5 characters', async () => {
            //Create a user who is admin
            let user = new User(
                {
                    name: 'Dilshad Rana',
                    email: 'someemail@yahoo.com',
                    password: 'Somepassword2020*',
                    isAdmin: true
                }
            );
            const token = user.generateAuthToken();
            //const token = new User().generateAuthToken();
            const res = await request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send(
                    {
                        name: 'Gen'//'Some Genre' will return status 200 and thus fail the test.
                    }
                );
            expect(res.status).toBe(400);
            /* The HyperText Transfer Protocol (HTTP) 400 Bad Request response status code indicates that the server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing) */
        });
        it('should return 400, if genre is greater than 50 characters', async () => {
            //Create a user who is admin
            let user = new User(
                {
                    name: 'Dilshad Rana',
                    email: 'someemail@yahoo.com',
                    password: 'Somepassword2020*',
                    isAdmin: true
                }
            );
            const token = user.generateAuthToken();
            //const token = new User().generateAuthToken();
            //Generate an invalid genre name i.e., more than 50 characters length
            //new Array(14).join('Gana').length will return 52 as 52 characters are generated.
            let invalidGenreName = new Array(14).join('Gana');//Generates an array with 14 items and then places string Gana between them i.e, 13 * 4 = 52 characters.
            const res = await request(server)
                .post('/api/genres')
                .set('x-auth-token', token)
                .send(
                    {
                        //name: 'GanaGanaGanaGanaGanaGanaGanaGanaGanaGanaGanaGanaGana';//52 characters
                        name: invalidGenreName//'GanaGanaGanaGanaGanaGanaGanaGanaGanaGanaGanaGanaGa' will return status 200 as they are 50 characters which is legal in this app, and thus fail the test.
                    }
                );
            expect(res.status).toBe(400);
            /* The HyperText Transfer Protocol (HTTP) 400 Bad Request response status code indicates that the server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing) */
        });
    });

});

/* You should write and execute each test as if it is the only test in the world. This means that each test should be
executed in a clean state. And if you modify the state, you should always clean up after; otherwise our tests will not
be repeatable.
*/