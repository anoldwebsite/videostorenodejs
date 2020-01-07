const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const genres = [
    {
        id: 1,
        name: 'Action'
    },
    {
        id: 2,
        name: 'Horror'
    },
    {
        id: 3,
        name: 'Romance'
    },
];
router.get('/', (req, res) => {
    res.send(genres);
});
function validateGenre(genre) {
    const schema = Joi.object({
        name: Joi.string().min(3).required()
    });
    const { error } = schema.validate(genre);//Destructuring
    //const { error, value } = schema.validate(genre);//Destructuring
    //If the input is valid then the error is undefined.
    return error;
};
//delete is used to delete a resouce
router.delete('/:id', (req, res) => {
    const video = genres.find(element => element.id === parseInt(req.params.id));
    if (!video) return res.status(404).send(`Viswo with id ${req.params.id} does not exist.`);//If video is undefined
    //Video exists; let's delete it.
    const videoIndex = genres.findIndex(element => element.id === parseInt(req.params.id));
    if (videoIndex !== -1) {//We have index of the course object in the array courses.
        res.send(genres.splice(videoIndex, 1));//1 means delete one object from the array starting from courseIndex
    }
});

router.get('/:id', (req, res) => {
    const video = genres.find(element => element.id === parseInt(req.params.id));
    if (video) return res.send(video);
    res.status(404).send(`Video with id ${req.params.id} was not found!`);//Video is undefined case
});

router.get('/:year/:month', function (req, res) {
    res.send(req.params);//http://localhost:3000/api/videos/2020/January gives
    /*     {
            "year": "2020",
            "month": "January"
        } */
});
//////////////////////////////////////////////////////////////////////
router.get('/:sortBy', (req, res) => {
    const sortBy = req.query.sortBy;
    if(sortBy === 'asc'){
        res.send(genres.sort( (a, b) => a - b) );
    }else if( sortBy === 'des'){
        res.send(genres.sort( (a, b) => b - a ) );
    }else{
        res.send("Give a sort order asc or des");
    }
});
router.post('/', (req, res) => {
    const error = validateGenre(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const genre = {
        id: genres.length + 1,
        name: req.body.name
    };
    genres.push(genre);
    res.send(genre);
});
//put is used to update a resource
router.put('/:id', (req, res) => {
    const genre = genres.find(element => element.id === parseInt(req.params.id));
    if (!genre) return res.status(404).send(`The video with id ${req.params.id} was not found.`);
    const error = validateGenre(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    genre.name = req.body.name;
    const videoIndex = genres.findIndex(element => element.id === parseInt(req.params.id));
    genres[videoIndex] = genre;
    res.send(genre);
});

module.exports = router;