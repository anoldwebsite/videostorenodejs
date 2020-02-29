
const request = require('supertest');
const { Genre } = require('../../../models/Genre');
const { User } = require('../../../models/User');
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
    beforeEach(() => {
        server = require('../../../index');
    });//Opern the server before each test.

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
        it('should return 404 status code if invalid id is passed.', async () => {
            const res = await request(server).get('/api/genres/1');
            expect(res.status).toBe(404);
        });
    });
    //Tests for router.post('/', [auth, admin], async (req, res) => { ........ }); in the file genres.js
    describe('POST /', () => {
        let name;
        beforeEach(() => {
            name = 'Genre One';//Set name, which is name of the genre, to an illegal name in a test where illegal name is needed before calling function exec().
        });
        //Can't have admin in the beforeEach as 3 of the tests fail. We set admin value in each sub-suite of tests and therefore, it is better to have it outside beforeEach otherwise we have to set admin value in each test instead of each descirbe().
        let admin = false;//This will set isAdmin: false and we will change the value to admin = true in individual tests where we need to create a user as admin. 

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
        const exec = async () => {
            //const token = generateToken();
            return request(server)
                .post('/api/genres')
                .set('x-auth-token', await generateToken())
                .send({ name });//It is the same as .send({ 'name': name });
        };
        describe('User not logged in', () => {
            it('should return 401, if client is not logged in', async () => {
                const res = await request(server).post('/api/genres').send({ name: 'Genre One' });//We are not sending the token,so not logged in.
                expect(res.status).toBe(401);//401 Unauthorized Error indicates that the requested resource is restricted and requires authentication
            });
        });
        describe('User logged in and admin', () => {
            admin = true;
            describe('Valid genre name', () => {
                it('should save the genre if it is valid', async () => {
                    await exec();//In this case we don't need the returned res object. //const res = await exec(); 
                    //Genre saved to the MongoDB. Now, retrieve it back from MongoDB to check if it has been saved there.
                    const genre = await Genre.find({ name: name });
                    //console.log(genre);
                    expect(genre).not.toBeNull();
                });
                it('should return the genre if it is valid', async () => {
                    //const token = new User().generateAuthToken();//If we use this line of code, the test still passes although the Genre.fin() command returns an empty array i.e., nothing saved tot he MongoDB.
                    const res = await exec();
                    //We don't need to query the database in this test. We even don't care about the value of the property _id. We just want to make sure that it exists.
                    //Genre saved to the MongoDB. Now, retrieve it back from MongoDB to check if it has been saved there.
                    //const genre = await Genre.find({ name: 'Genre One' });
                    //console.log(res.body);
                    expect(res.body).toHaveProperty('_id');
                    expect(res.body).toHaveProperty('name', 'Genre One')
                });
            });
            describe('invalid genre name', () => {
                it('should return 400, if genre is less than 5 characters', async () => {
                    //const token = new User().generateAuthToken();
                    name = 'Gen';
                    const res = await exec(); //false means not admin i.e., isAdmin: false in the object user of class User
                    expect(res.status).toBe(400);
                    /* The HyperText Transfer Protocol (HTTP) 400 Bad Request response status code indicates that the server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing) */
                });
                it('should return 400, if genre is greater than 50 characters', async () => {
                    //Generate an invalid genre name i.e., more than 50 characters length
                    //new Array(14).join('Gana').length will return 52 as 52 characters are generated.
                    //name = new Array(14).join('Gana');//Generates an array with 14 items and then places string Gana between them i.e, 13 * 4 = 52 characters.
                    name = new Array(52).join('G');//51 will fail the test
                    const res = await exec();
                    expect(res.status).toBe(400);
                    /* The HyperText Transfer Protocol (HTTP) 400 Bad Request response status code indicates that the server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing) */
                });
            });
        });
        describe('User logged in but not admin', () => {
            it('should return 403, if client is logged in but not admin', async () => {
                admin = false;
                const res = await exec();
                expect(res.status).toBe(403);
                /* HTTP 403 provides a distinct error case from HTTP 401; while HTTP 401 is returned when the client has not authenticated, and implies that a successful response may be returned following valid authentication, HTTP 403 is returned when the client is not permitted access to the resource despite providing authentication such as insufficient permissions of the authenticated account. */
            });
        });
    });
});

/* You should write and execute each test as if it is the only test in the world. This means that each test should be
executed in a clean state. And if you modify the state, you should always clean up after; otherwise our tests will not
be repeatable.
*/