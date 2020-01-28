module.exports = function (req, res, next) {
    //Status code: 401  ==> Unauthorized . When a user tries to access a resource that (s)he is not authorized to access. No valid web token.
    //Status code: 403 ===> Forbidden. Don't try again.
    if (!req.user.isAdmin) return res.status(403).send('Access Denied!');
    next();//See comments below after this function.
}
/*
Middleware functions are functions that have access to the request object (req),
the response object (res), and the next function in the application’s request-response
cycle. The next function is a function in the Express router which, when invoked,
executes the middleware succeeding the current middleware.

Middleware functions can perform the following tasks:

Execute any code.
Make changes to the request and the response objects.
End the request-response cycle.
Call the next middleware in the stack.
If the current middleware function does not end the request-response cycle,
it must call next() to pass control to the next middleware function.
Otherwise, the request will be left hanging.
*/