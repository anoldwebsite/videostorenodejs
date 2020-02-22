
const request = require('supertest');
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
    afterEach(() => { server.close(); });//shut down the server after each test.

    describe('GET /', () => {
        it('should return all genres', async () => {
            const res = await request(server).get('/api/genres');
            expect(res.status).toBe(200);
        });
    });
});