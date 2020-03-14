const request = require('supertest');
const { Genre } = require('../../../models/Genre');
const { User } = require('../../../models/User');
const { Customer } = require('../../../models/Customer');
const { Movie } = require('../../../models/Movie');
const { Rental } = require('../../../models/Rental');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

let server;

describe('/api/rentals', () => {
    beforeEach(() => {
        server = require('../../../index');
    });
    afterEach(async () => {
        await User.deleteMany({});
        await Genre.deleteMany({});
        await Movie.deleteMany({});
        await User.deleteMany({});
        await Customer.deleteMany({});
        await Rental.deleteMany({});
        server.close();//Asks the server to stop accepting new connections.
    });

    describe('POST /', () => {

        let admin, customerId, genre, genreName, movieTitle, movieId, token;
        let rentalType = 'borrow';

        const generateGenre = async () => {
            const insertedGenre = await Genre.collection.insertOne({ name: genreName });
            //const genreId = insertedGenre.insertedId;
            genre = insertedGenre.ops[0];
        };

        const generateMovie = async () => {
            const insertedMovie = await Movie.collection.insertOne({ title: movieTitle, genre: genre, numberInStock: 3, dailyRentalRate: 5 });
            movieId = insertedMovie.insertedId;
            //const movie = insertedMovie.ops[0];
        };

        const generateCustomer = async () => {
            const insertedCustomer = await Customer.collection.insertOne({ name: 'Dilshad Rana', phone: '1234567890', isGold: false, numberOfMoviesRented: 3, pendingTransactions: [] });
            customerId = insertedCustomer.insertedId;
            //const customer = insertedCustomer.ops[0];
        };
        const generateAdminToken = () => {
            admin = true;
            const user = {
                _id: mongoose.Types.ObjectId().toHexString(),
                isAdmin: admin
            }
            token = new User(user).generateAuthToken();
        };
        const preExec = async () => {
            generateAdminToken();
            await generateGenre();
            await generateMovie();
            await generateCustomer();
        };

        const exec = async () => {
            //return await Rental.collection.insertOne({ movieId: movieId, customerId: customerId, rentalType: rentalType });//console.log(res.ops[0]);
            return await request(server)
                .post('/api/rentals')
                .set('x-auth-token', token)
                .send(
                    {
                        movieId: movieId,
                        customerId: customerId,
                        rentalType: rentalType
                    }
                );
        };
        it('should post the borrow rental, if the input is valid', async () => {
            genreName = 'Genre One';
            movieTitle = 'Movie One';
            await preExec();
            const res = await exec();
            //console.log(res.text);
            expect(res.text).toMatch(/borrow/);
            expect(res.text).toMatch(/Movie One/);
            expect(res.text).toMatch(/Dilshad Rana/);
        });
        it('should return 400 and NOT post the return rental, if the movie has not been rented and trying to return it.', async () => {
            genreName = 'Genre One';
            movieTitle = 'Movie One';
            await preExec();
            rentalType = 'return';
            const res = await exec();
            //console.log(res.text);
            expect(res.status).toBe(400);
        });
        it('should post the return rental, if the input is valid', async () => {
            genreName = 'Genre One';
            movieTitle = 'Movie One';
            await preExec();
            //First borrow the book as we can not post a return rental, if it has not been borrowed.
            rentalType = 'borrow';
            await exec();
            rentalType = 'return';
            const res = await exec();
            //console.log(res.text);
            expect(res.text).toMatch(/return/);
            expect(res.text).toMatch(/Movie One/);
            expect(res.text).toMatch(/done/);
            expect(res.text).toMatch(/source/);
            expect(res.text).toMatch(/destination/);
        });
        it('should return 400, if the user has already borrowed once copy of this movie', async () => {
            genreName = 'Genre One';
            movieTitle = 'Movie One';
            await preExec();
            await exec();
            const res = await exec();
            expect(res.text).toMatch(/you have already rented one copy of this movie/);
            expect(res.status).toBe(400);
            //console.log(res.text);
            //console.log(res.error);
        });
        it('should return 400, if the user tries to borrow a movie when she has already borrowed 10 or more books.', async () => {
            genreName = 'Genre One';
            movieTitle = 'Movie One';
            await preExec();
            //Make the user borrow 9 books
            await Customer.findByIdAndUpdate(customerId, { numberOfMoviesRented: 9 });
            await exec();//Borrowing the 10the copy of the product.
            movieTitle = 'Movie Two';
            await generateMovie();
            const res = await exec();//Borrowing 11th copy of the product.
            expect(res.text).toMatch(/ou have already rented 10 movies/);
            expect(res.status).toBe(400);
            //console.log(res.text);
            //console.log(res.error);
        });
        it('should return 400, if product out of stock.', async () => {
            genreName = 'Genre One';
            movieTitle = 'Movie One';
            await preExec();
            //Make sure that there is only one copy of the movie with title 'Movie One' in the database.
            await Movie.findByIdAndUpdate(movieId, { numberInStock: 1 });
            await exec();//Borrow the only copy available.
            const res = await exec();//Try to borrow another copy when it is out of stock.
            console.log(res.text);
            expect(res.text).toMatch(/Out of stock!/);
            expect(res.status).toBe(400);
        });
        it('should return 404 if trying to rent a movie that is not in the database', async () => {
            movieId = mongoose.Types.ObjectId();
            await generateCustomer();
            const res = await exec();
            expect(res.status).toBe(404);
            expect(res.text).toMatch(/Movie Not found in the database!/);
        });
    });
    describe('GET /', () => {
        it('should return all rentals', async () => {
            await Rental.collection.insertMany(
                [
                    { movieId: mongoose.Types.ObjectId().toHexString(), customerId: mongoose.Types.ObjectId().toHexString(), rentalType: 'borrow' },
                    { movieId: mongoose.Types.ObjectId().toHexString(), customerId: mongoose.Types.ObjectId().toHexString(), rentalType: 'borrow' },
                    { movieId: mongoose.Types.ObjectId().toHexString(), customerId: mongoose.Types.ObjectId().toHexString(), rentalType: 'borrow' }
                ]
            );
            const res = await request(server).get('/api/rentals');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(3);
            //console.log(res.body);
        });
        it('should return 404 if no rentals are found', async () => {
            const res = await request(server).get('/api/rentals');
            console.log(res.body);
            expect(res.status).toBe(404); 
        });
    });
    describe('GET /:id', () => {
        it('should return the rental with valid input.', async () => {
            movieId = mongoose.Types.ObjectId().toHexString();
            customerId = mongoose.Types.ObjectId().toHexString();
            const insertedRental = await Rental.collection.insertOne({ movieId, customerId, rentalType: 'borrow' });
            const rentalId = insertedRental.insertedId;//This gives rental._id
            const res = await request(server).get('/api/rentals/' + rentalId);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('rentalType', 'borrow');
            expect(res.body).toHaveProperty('movieId', movieId);
            expect(res.body).toHaveProperty('customerId', customerId);
            //console.log(res.body);
        });
        it('should return 404, if an invalid rental id is input', async () => {
            const res = await request(server).get('/api/rentals/1');
            console.log(res.text);
            expect(res.status).toBe(404);
        });
        it('should return 404, if no rental record is found having this rental id!', async () => {
            const res = await request(server).get('/api/rentals/' + mongoose.Types.ObjectId());
            console.log(res.text);
            expect(res.status).toBe(404);
        });
    });
});