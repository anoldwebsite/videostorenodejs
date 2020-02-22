
const config = require('config');//The config package gives us an elegant way to store configuration settings for our app.

module.exports = function () {
    //Configuration
    if (!config.get('jwtPrivateKey')) {//On terminal in VS CODE //export vidly3_jwtPrivateKey=mySecretKeyExample //You set the environment variable with export (on Mac) and set (on Windows) terminal
        throw new Error('FATAL ERROR: jwtPrivateKey is not defined.');
        //Don't throw error like this: thorw 'error'; as you will not get a stack trace. 
        //process.exit(1);//0 is for no error; any other code is for error. The app error management code should do it for us.
    }
    //console.log('Application Name: ' + config.get('name'));
    //console.log('Mail Server: ' + config.get('mail.host'));
    //console.log('Mail Password: ' + config.get('mail.password'));
};