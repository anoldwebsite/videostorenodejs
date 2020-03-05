const request = require('supertest');
const { Movie } = require('../../../models/Movie');
const { User } = require('../../../models/User');
const mongoose = require('mongoose');

let server;

describe('/api/movies', () => {
    beforeEach(() => {
        server = require('../../../index');
    });
    afterEach(async () => {
        server.close();
        await Movie.deleteMany({});
    });
    describe('GET /', () => {
        it('should return all movies', async () => {
            await Movie.collection.insertMany(
                [
                    { title: "Movie One", genreId: mongoose.Types.ObjectId(), numberInStock: 3, dailyRentalRate: 10 },
                    { title: "Movie One", genreId: mongoose.Types.ObjectId(), numberInStock: 3, dailyRentalRate: 10 },
                    { title: "Movie One", genreId: mongoose.Types.ObjectId(), numberInStock: 3, dailyRentalRate: 10 }
                ]
            );
            const res = await request(server).get('/api/movies');
            expect(res.status).toBe(200);
            expect(res.body.some(g => g.title === 'Movie One'));
            expect(res.body.some(g => g.title === 'Movie Two'));
            expect(res.body.some(g => g.title === 'Movie Three'));
        });
    });
});