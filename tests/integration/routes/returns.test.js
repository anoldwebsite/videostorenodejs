//returns.test.js
//Return 401 if client is not logged in

//Return 400 if customerId is not provided

//Return 400 if movieId is not provided

//Return 404 if no rental is found for this movie/customer (Has not rented / Has not been rented)

//Return 400 if rental already processed.

/*
	Return 200 if valid return request and furthermore, do the following:
	==> Set the return date
	==> Calculate the rental fee
	==> Increase the stock
	==> Return a summar of the rental to the customer. (Date borrowed, Date redturened, Rental fee etc.)
*/
const mongoose = require('mongoose');
const { Rental } = require('../../../models/Rental');

describe('/api/returns', () => {
    //Load the server and populate the database
    let server, customerId, movieId, rental;
    beforeEach(async () => {
        server = require('../../../index');
        customerId = mongoose.Types.ObjectId();
        movieId = mongoose.Types.ObjectId();
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
                rentalType: 'return'
            }
        );
        await rental.save();
    }
    );
    //Clean up after each test.
    afterEach(async () => {
        server.close();//Ask the server to stop accepting new connections.
        await Rental.collection.deleteMany({});
    });
    //Test to test our set up code
    it('should work by making sure that the rental is in the DB', async () => {
        const res = await Rental.findById(rental._id);
        //console.log(res);//Returns the rental record/document
        expect(res).not.toBeNull();
    });
});