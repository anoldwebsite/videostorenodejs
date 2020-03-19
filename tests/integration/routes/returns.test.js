//returns.test.js
const request = require('supertest');//The function returned is pointed to by request.
const mongoose = require('mongoose');
const moment = require('moment');
const { Rental } = require('../../../models/Rental');
const { Movie } = require('../../../models/Movie');
const { User } = require('../../../models/User');

describe('/api/returns', () => {
    let server, token, rental, movie;
    let customerId, movieId, rentalType;

    const exec = () => {
        return request(server)
            .post('/api/returns')
            .set('x-auth-token', token)
            .send({ customerId, movieId, rentalType });
        //.send({ customerId, movieId, rentalType });
    };

    beforeEach(async () => {
        server = require('../../../index');//Load the server
        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();
        rentalType = 'return';
        token = new User().generateAuthToken();
        //Populate the database with at least one Rental
        //Make a movie object
        movie = new Movie(
            {
                _id: movieId,
                title: 'Movie One',
                dailyRentalRate: 2,
                numberInStock: 10,
                genre: { name: 'Genre One' }
            }
        );
        await movie.save();
        //Make a Rental object
        rental = new Rental(
            {
                //Make a Customer object
                customer: {
                    _id: customerId,
                    name: 'Dilshad Rana',
                    phone: '1234567890'
                },
                movie: {
                    _id: movieId,
                    title: 'Movie One',
                    dailyRentalRate: 2
                },
                rentalType: rentalType
            }
        );
        await rental.save();
    }
    );
    //Clean up after each test.
    afterEach(async () => {
        await server.close();//Ask the server to stop accepting new connections.
        await Rental.collection.deleteMany({});
        await Movie.collection.deleteMany({});
    });

    it('should return 401 if client is not logged in', async () => {
        token = '';
        const res = await exec();
        expect(res.status).toBe(401);
    });

    it('should return 400 if customerId is not provided.', async () => {
        customerId = '';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 400 if movieId is not provided.', async () => {
        movieId = '';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 404 if no rental is found for this movie by this customer', async () => {
        await Rental.collection.deleteMany({});
        const res = await exec();
        expect(res.status).toBe(404);
    });

    it('should return 400 if return for rental already processed', async () => {
        rental.dateReturned = new Date();//Now, the movie has been marked as returned.
        await rental.save();//Save the date of return to the database.
        const res = await exec();//Try to return the rental after its return has already been processed.
        //console.log(res);
        expect(res.status).toBe(400);
        //expect(res.body.dateReturned).not.toBeNull();
    });

    it('should return 200 with valid input to /api/rentals', async () => {
        const res = await exec();
        expect(res.status).toBe(200);
    });

    it('should set the returnDate if input is valid', async () => {
        await exec();
        const rentalSaved = await Rental.findById(rental._id);
        const diff = new Date() - rentalSaved.dateReturned;
        expect(diff).toBeLessThan(10 * 1000);//10 seconds 
    });

    it('should set the rentalFee if input is valid', async () => {
        //For the sake of testing, set the date of borrowing manually 
        //Create a moment object that is 7 days before. We use package moment.
        rental.dateOut = moment().add(-7, 'days').toDate();
        await rental.save();
        await exec();
        const rentalSaved = await Rental.findById(rental._id);
        expect(rentalSaved.rentalFee).toBe(14);// 7 days * 2 $ per day.
    });

    it('should increase the movie stock after a return', async () => {
        await exec();
        const updatedMovie = await Movie.findById(movieId);
        expect(updatedMovie.numberInStock).toBe(movie.numberInStock + 1);
    });

    it('should return the rental, if input is valid.', async () => {
        const res = await exec();
        const updatedRental = await Rental.findById(rental._id);
        //Object.keys(res.body) will return an array of the keys of object rental, which is in the res.body
        expect(Object.keys(res.body)).toEqual(
            expect.arrayContaining(['dateOut', 'dateReturned', 'rentalFee', 'customer', 'movie'])
        );
        // expect(res.body).toHaveProperty('dateOut');
        // expect(res.body).toHaveProperty('dateReturned');
        // expect(res.body).toHaveProperty('rentalFee');
        // expect(res.body).toHaveProperty('customer');
        // expect(res.body).toHaveProperty('movie');

        //expect(res.body).toMatchObject(updatedRental);
        //  The test above will fail because the expected object has
        // the property returnDate in the standard javascript date format where as the one retunred in the res.body
        // i.e., the response sent by the server is a JSON date object. This test is too specific. 
    });
});