/** paquetes */

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var sha1 = require('sha1');
var loki = require('lokijs');

var jwt = require('jsonwebtoken');
var config = require('./config');
var Users = require('./app/models/user');

/** configuracion */

var port = process.env.PORT || 8080;
app.set('superSecret', config.secret);
app.set('expiration', config.expiration);

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

var db = new loki('db.json', {
    autoload: true,
    autoloadCallback: loadHandler,
    autosave: true,
    autosaveInterval: 10000
});

function loadHandler() {
    // if database did not exist it will be empty so I will intitialize here
    var coll = db.getCollection('users');
    if (coll === null) {
        coll = db.addCollection('users');
    }

    Users.init(coll);
}



/** API */
var apiRoutes = express.Router();

apiRoutes.post('/authenticate', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    debugger;

    if (!username || !password) {
        res.status(400)
        res.json({
            'error': 'Username required'
        });
    }

    res.json(Users.getUser(null, username, sha1(password)));
});


apiRoutes.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err && err.name === 'TokenExpiredError') {
              // in case it is expired it creates it again and returns it in a header
              var _user = jwt.decode(token);
              var _newtoken = jwt.sign({username:_user.username,password:_user.password}, config.secret, {
                expiresIn:  app.get('expiration')
              });
              res.set('x-access-token', _newtoken);
              res.decoded = decoded;
              next();
            } else if (err){
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});


apiRoutes.get('/', function(req, res) {
    res.json({
        message: 'Welcome to the coolest API on earth!'
    });
});

apiRoutes.get('/users', function(req, res) {
    var users = Users.getAll();

    res.json(users);
});

apiRoutes.post('/users', function(req, res) {
    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;

    if (!username || !password) {
        res.status(400)
        res.json({
            'error': 'Username or Password required'
        });
    }

    var users = Users.saveUser(null, username, password);

    res.json(users);
});


app.use('/api', apiRoutes);


/**  */

app.listen(port);
console.log('Server listening in port: ' + port);