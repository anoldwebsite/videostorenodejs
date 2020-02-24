const mongoose = require('mongoose');
module.exports = function (req, res, next) {
    /* This route handler does not respond with status 404 unless we ensure that the req.params.id is a valid object id and not just a number like 1, 3, etc.  */
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).send('Invalid Id.');
    }
    next();
}