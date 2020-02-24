
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

function myFunc(server, serverClosed) {
    let message =
        `
        Number of connections to the server: ${server.connections}
        Is the server listening for connections?: ${server.listening}
    `;
    if (serverClosed) {
        message =
            `
        Line of code server.clos() has been executed.
        Number of connections to the server: ${server.connections}
        Is the server listening for connections?: ${server.listening}
        `
    }
    console.log(message);
}


//Test suit for the route /api/genres
describe('/api/genres', () => {
    //Test suit for getting all genres
    beforeEach(() => { server = require('../../index'); });//Opern the server before each test.

    afterEach(async () => {
        myFunc(server, false);//false means line of code server.close() has not been executed yet.
        await server.close();
        for (let i = 0; i < 3; i++) {
            console.log(i + 1);
            myFunc(server, true);//true means line of code server.close() has been executed. 
        }

        await Genre.deleteMany({});//await Genre.remove({});//deprecated. USe deleteMany();
        for (let i = 0; i < 3; i++) {
            console.log(i + 1);
            myFunc(server, true);//true means line of code server.close() has been executed. 
        }

    });//shut down the server after each test.

    describe('GET /', () => {
        it('should return all genres', async () => {
            await Genre.collection.insertMany(
                [
                    { name: 'Genre One' },
                    { name: 'Genre Two' }
                ]
            );
            console.log("**************************************");
            myFunc(server, false);//false means that the line of code server.close() has not been executed yet.
            const res = await request(server).get('/api/genres');
            myFunc(server, false);//false means that the line of code server.close() has not been executed yet.
            console.log("**************************************");
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);//2 means two Genre objects in the database. res.body retrns an array.
            expect(res.body.some(g => g.name === 'Genre One')).toBeTruthy();
            /* (callbackfn: (value: T, index: number, array: readonly T[]) => unknown, thisArg?: any): boolean
                A function that accepts up to three arguments. The some method calls the callbackfn function for each element in the array until the callbackfn returns a value which is coercible to the Boolean value true, or until the end of the array.
                Determines whether the specified callback function returns true for any element of an array.
            */
            expect(res.body.some(g => g.name === 'Genre Two')).toBeTruthy();
        });
    });
});

/* You should write and execute each test as if it is the only test in the world. This means that each test should be
executed in a clean state. And if you modify the state, you should always clean up after; otherwise our tests will not
be repeatable.
*/