const jwt = require('jsonwebtoken');
//We need the environment variable to read the private key from.
const config = require('config');

//The third argument, next, is used to pass control to the next middleware function in the request processing pipeline.
module.exports = (req, res, next) => {
    //Give access to this API endpoint after checking the token from the hearder.
    const token = req.header('x-auth-token');//Get the token from the header.
    //State 401 means that the client does not have the authentication credentials to access a resource on this server.
    if (!token) return res.status(401).send('Access denied. No token provided.');//First execution path - No token. So the file needs three tests for testing as we have three execution paths in the file.
    try {//Second execution path - valid token - So the file needs three tests for testing as we have three execution paths in the file.
        //throw new Error();
        //We encode the payload in a method in the userSchema in the model User in User.js. Here, we decode it.
        const decodedPayload = jwt.verify(token, config.get('jwtPrivateKey'));
        //adds a 'user' property to the req object and assign to it the decodedPayload.
        req.user = decodedPayload;//After this assignment, we have access to req.user._id
        /* 
        Pass control to the next middleware function in the request processing pipeline, 
        which in this case is the routehandler. We either terminate the request response lifecycle or
        pass control to the next middleware function.
        */
        next();
    } catch (error) {//Third execution path - in case of invalid token. So the file needs three tests for testing as we have three execution paths in the file.
        res.status(400).send('Invalid token');
    }

};

//module.exports = auth;