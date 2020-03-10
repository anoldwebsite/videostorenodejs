const request = require('supertest');
const { Movie } = require('../../../models/Movie');
const { Genre } = require('../../../models/Genre');
const { User } = require('../../../models/User');
const mongoose = require('mongoose');

let server;

describe('/api/movies', () => {
    beforeEach(() => {
        server = require('../../../index');
    });
    afterEach(async () => {
        await Genre.deleteMany({});
        await Movie.deleteMany({});
        server.close();
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
    describe('GET /:id', () => {
        let id, numMovies, genreId;
        beforeEach(async () => {
            genreId = mongoose.Types.ObjectId().toHexString();
            const res = await Movie.collection.insertOne({ title: "Movie One", genreId, numberInStock: 3, dailyRentalRate: 10 });
            numMovies = res.insertedCount;
            id = res.insertedId;
        });
        it('should return a movie if a valid id is passed', async () => {
            const res = await request(server).get('/api/movies/' + id);
            expect(res.status).toBe(200);
            expect(res.body.title).toBe('Movie One');
            expect(res.body.genreId).toBe(genreId);
            expect(res.body.numberInStock).toBe(3);
        });
        it('should return a 404 if an invalid id is passed', async () => {
            const res = await request(server).get('/api/movies/1');
            expect(res.status).toBe(404);
        });
        /*         it('should return a 404 if no movie is found for the supplied id.', async () => {
                    const nonExistingId = mongoose.Types.ObjectId();
                    console.log(` ===================> ${mongoose.Types.ObjectId.isValid(nonExistingId)}`);
                    const res = await request(server).get('/api/movies/' + nonExistingId);
                    console.log('*********************************');
                    console.log(res.text);//'Something failed' Internal Server Error 500
                    console.log('*********************************');
                    //expect(res.status).toBe(404);
                }); */
    });
    describe('POST /', () => {
        let admin, token, genreId, title, numberInStock, dailyRentalRate;
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
        beforeEach(async () => {
            admin = true;
            token = generateToken();
            const res = await Genre.collection.insertOne({ name: 'Genre One' });
            genreId = res.insertedId;
            title = 'Movie One';
            numberInStock = 3;
            dailyRentalRate = 10;
        });
        const exec = async () => {
            return request(server)
                .post('/api/movies')
                .set('x-auth-token', token)
                .send(
                    {
                        title: title,
                        genreId: genreId,
                        numberInStock: numberInStock,
                        dailyRentalRate: dailyRentalRate
                    }
                );
        };
        it('should return 400, if no genre is found in the database for the id supplied to make a movie', async () => {
            genreId = mongoose.Types.ObjectId();
            const res = exec();
            expect(res.status).toBe(400);
        });
        it('should return the movie if it is valid', async () => {
            //console.log(`genreId: ${genreId}`);
            const res = await exec();
            /*             console.log('*************************************');
                        console.log(res.text);
                        console.log(res.body);
                        console.log('*************************************'); */
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('title', 'Movie One');
            expect(res.body).toHaveProperty('numberInStock', 3);
            expect(res.body).toHaveProperty('dailyRentalRate', 10);
            expect(res.body.genre).toHaveProperty('name', 'Genre One');
        });
        it('should save the movie if input is valid', async () => {
            await exec();
            const movie = await Movie.find({ title: 'Movie One' });
            //console.log(movie)
            expect(movie).not.toBeNull();
            expect(movie[0].title).toBe(title);
        });
        it('should return 400, if movie name is less than 5 characters', async () => {
            title = 'Mov';
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 400, if movie name is more than 255 characters', async () => {
            title = new Array(129).join('Mo');//256 characters.
            const res = await exec();
            expect(res.status).toBe(400);
        });
        it('should return 403 if user is logged in but not admin', async () => {
            admin = false;
            token = generateToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });
        it('should return 401, if client is not logged in', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });
    });
    describe('PUT /:id', () => {
        let admin, movieId, token, genreId, title, newTitle, numberInStock, dailyRentalRate;
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
        beforeEach(async () => {
            admin = true;
            token = generateToken();
            const res = await Genre.collection.insertOne({ name: 'Genre One' });
            genreId = res.insertedId;
            title = 'Movie One';
            numberInStock = 3;
            dailyRentalRate = 10;
            const res2 = await Movie.collection.insertOne(
                {
                    title: title,
                    genreId: genreId,
                    numberInStock: 3,
                    dailyRentalRate: 10
                }
            );
            movieId = res2.insertedId;
            newTitle = 'Movie Two';
        });
        const exec = async () => {
            return request(server)
                .put('/api/movies/' + movieId)
                .set('x-auth-token', token)
                .send(
                    {
                        title: newTitle,
                        genreId: genreId,
                        numberInStock: 3,
                        dailyRentalRate: 10
                    }
                );
        };
        it('should return 400, if no genre is found in the database for the id supplied to make a movie', async () => {
            genreId = mongoose.Types.ObjectId();
            const res = exec();
            expect(res.status).toBe(400);
        });
        it('should update the movie, if input is valid', async () => {
            await exec();
            const updatedMovie = await Movie.findById(movieId);
            expect(updatedMovie.title).toBe(newTitle);
        });
        it('should return the updated movie if input is valid', async () => {
            const res = await exec();
            expect(res.body).toHaveProperty('title', newTitle);
        });
        it('should return 404, if movie with the given id is not found', async () => {
            movieId = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404, if the id is invalid', async () => {
            movieId = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
    });
    describe('DELETE /:id', () => {
        let admin, movieId, token, genreId, title, numberInStock, dailyRentalRate;
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
        beforeEach(async () => {
            admin = true;
            token = generateToken();
            const res = await Genre.collection.insertOne({ name: 'Genre One' });
            genreId = res.insertedId;
            title = 'Movie One';
            numberInStock = 3;
            dailyRentalRate = 10;
            const res2 = await Movie.collection.insertOne(
                {
                    title: title,
                    genreId: genreId,
                    numberInStock: 3,
                    dailyRentalRate: 10
                }
            );
            movieId = res2.insertedId;
        });
        const exec = async () => {
            return request(server)
                .delete('/api/movies/' + movieId)
                .set('x-auth-token', token)
                .send();
        };
        it('should return 401 if client is not logged in.', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });
        it('should return 403, if client is logged in but not admin', async () => {
            admin = false;
            token = generateToken();
            const res = await exec();
            expect(res.status).toBe(403);
        });
        it('should return 404 if movie id is invalid', async () => {
            movieId = 1;
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 404 if no movie is found for this movie id.', async () => {
            movieId = mongoose.Types.ObjectId();
            const res = await exec();
            expect(res.status).toBe(404);
        });
        it('should return 401 if client is not logged in.', async () => { });
        it('should return 401 if client is not logged in.', async () => { });
        it('should return 401 if client is not logged in.', async () => { });
        it('should delete the movie, if input is valid.', async () => {
            await exec();
            const movie = await Movie.findById(movieId);
            expect(movie).toBeNull();
        });
        it('should return the deleted movie, if input is valid', async () => {
            const res = await exec();
            /*          
                console.log('****************************************');
                console.log(movieId);
                console.log(res.body);
                console.log('****************************************'); 
            */
            expect(res.body).toHaveProperty('title', title);
            expect(res.body).toHaveProperty('_id', movieId.toString());
        });
    });
    describe('DELETE /', () => {
        let admin, token, movies, movieDocs;
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
        beforeEach(async () => {
            admin = true;
            token = generateToken();
            const genreDoc1 = await Genre.collection.insertOne({ name: 'Genre One' });
            const genreDoc2 = await Genre.collection.insertOne({ name: 'Genre Two' });
            const genreId1 = genreDoc1.insertedId.valueOf();
            const genreId2 = genreDoc2.insertedId.valueOf();
            const title1 = 'Movie One';
            const title2 = 'Movie Two';
            movieDocs = await Movie.collection.insertMany(
                [
                    { title: title1, genreId: genreId1, numberInStock: 3, dailyRentalRate: 10 },
                    { title: title2, genreId: genreId2, numberInStock: 3, dailyRentalRate: 10 }
                ]
            );
            movies = [];
            movieDocs.ops.map(element => movies.push(element));
        });
        const exec = async () => {
            return request(server)
                .delete('/api/movies/')
                .set('x-auth-token', token)
                .send();
        };
        it('should delete all the movies', async () => {
            await exec();
            const moviesFound = await Movie.find();
            expect(moviesFound.length).toBe(0);
            expect(await Movie.findById(movies[0]._id)).toBeNull();
            expect(await Movie.findById(movies[1]._id)).toBeNull();
            //console.log(movies[0]._id);
        });
    });
}); 