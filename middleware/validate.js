module.exports = (validator) => {//The argument validator is a function that takes argument req.body
    //The function that we are exporting from this moudle returns a function that takes arguments req, res and next.
    return (req, res, next) => {
        const { error } = validator(req.body);
        if (error) return res.status(400).send(error.details[0].message);
        next();
    }
};