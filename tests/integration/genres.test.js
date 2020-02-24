
const request = require('supertest');
const { Genre } = require('../../models/Genre');
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
});

/* You should write and execute each test as if it is the only test in the world. This means that each test should be
executed in a clean state. And if you modify the state, you should always clean up after; otherwise our tests will not
be repeatable.
*/