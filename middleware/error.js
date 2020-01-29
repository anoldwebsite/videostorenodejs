module.exports = function (err, req, res, next) {
    //TODO: Log the exception
    res.status(500).send('Something failed!');//500 means that server can not process the request for an unknown reason.
}
/* Dealing error handling in a separate module and then exporting
it to be used in all the other modules is due to the software engineering
principle of Separation of Concerns which results in a better app design. */