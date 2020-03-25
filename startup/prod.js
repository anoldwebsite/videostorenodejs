//All the middleware that we want to install for the production environement goes here.
const helmet = require('helmet');
const compression = require('compression');

module.exports = function(app) {
    app.use(helmet());
    app.use(compression());
}