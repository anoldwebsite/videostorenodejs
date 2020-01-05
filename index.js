require('dotenv').config();

const Joi = require('@hapi/joi');

const express = require('express');
const app = express();
app.use(express.json());

const courses = [
    {
        id: 1,
        name: 'course1'
    },
    {
        id: 2,
        name: 'course2'
    },
    {
        id: 3,
        name: 'course3'
    },
];

app.get('/', (req, res) => {
    res.send("I am tired of writing Hello World Programs!");
});

app.get('/api/courses', (req, res) => {
    res.send(courses);//// http://localhost:5000/api/courses/ gives
    /*     [
            {
                "id": 1,
                "name": "course1"
            },
            {
                "id": 2,
                "name": "course2"
            },
            {
                "id": 3,
                "name": "course3"
            }
        ] */
});
function validateCourse(course) {
    const schema = Joi.object({
        name: Joi.string().min(3).required()
    });
    const { error, value } = schema.validate(course);//Destructuring
    //If the input is valid then the error is undefined.
    return error;
};

app.delete('/api/courses/:id', (req, res) => {
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if (!course) return res.status(404).send(`Course with id ${req.params.id} does not exist.`);//If course is undefined
    //Course exists; let's delete it.
    const courseIndex = courses.findIndex(c => c.id === parseInt(req.params.id));
    if (courseIndex !== -1) {//We have index of the course object in the array courses.
        res.send(courses.splice(courseIndex, 1));//1 means delete one object from the array starting from courseIndex
    }
});

app.get('/api/courses/:id', (req, res) => {
    const course = courses.find(element => element.id === parseInt(req.params.id));
    if (course) return res.send(course);
    res.status(404).send(`Course with id ${req.params.id} was not found!`);//course is undefined case
    /*
    // http://localhost:5000/api/courses/2 gives     
    {
            "id": 2,
            "name": "course2"
        } */
});

app.get('/api/posts/:year/:month', function (req, res) {
    res.send(req.params);//http://localhost:3000/api/posts/2020/January gives
    /*     {
            "year": "2020",
            "month": "January"
        } */
});
//Query parameters are stored in an object with a bunch of key:value pairs.
app.get('/api/hr/staff', (req, res) => {
    res.send(req.query);// http://localhost:3000/api/hr/staff?name=Dilshad%20Rana gives
    /*
        {
            "name": "Dilshad Rana"
        }
    */
});
app.post('/api/courses', (req, res) => {
    const error = validateCourse(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const newCourse = {
        id: courses.length + 1,
        name: req.body.name
    };
    courses.push(newCourse);
    res.send(newCourse);
});

app.put('/api/courses/:id', (req, res) => {
    const course = courses.find(element => element.id === parseInt(req.params.id));
    if (!course) return res.status(404).send(`The course with id ${req.params.id} was not found.`);
    const error = validateCourse(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    course.name = req.body.name;
    const courseIndex = courses.findIndex(c => c.id === parseInt(req.params.id));
    courses[courseIndex] = course;
    res.send(course);
});

//process is an ojbect. env is a property of object proccess. PORT is the name of the environment variable 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
console.log("*************");
console.log(process.env.PORT);
console.log("*************");