const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index', {//index is for the index.pug in the folder ./views
        title: "My Express App",
        message: "Welcome to the largest collection of movies online!"
    })
});

module.exports = router;