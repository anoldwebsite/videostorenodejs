module.exports = function asyncMiddleware(handler) {
    //Return an anonymous asynchronous function that uses the function handler that we got as parameter.
    return async (req, res, next) => {
        try {
            await handler(req, res);
        } catch (ex) {
            next(ex);
        }
    };
}