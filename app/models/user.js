var _ = require('lodash');
var sha1 = require('sha1');
var jwt = require('jsonwebtoken');
var config = require('../../config');

module.exports = {
	init: function(collection) { this.users = collection},
	users:null,
	getAll: function (error) {
		if (error) {
			return {'error':error};
		}

		return this.users.data;
	},
	getUser: function(error,username,password) {
		if (error) {
			return {'error':error};
		}

		if (!(username && password)) {
			return {'error':'Username & Password required'};
		}

		// buscamos el usuario
		var user = this.users.findObject({username:username});

		if (!user) { return {'error':'User not exists'};}
		if (user.password !== password) { return {'error':'Password not valid'};}

		// si todo esta en orden creamos un token
		var token = jwt.sign(user, config.secret, {
          expiresIn:  app.get('expiration')
        });

		return {user:{
			name:user.username,
			token:token
		}};

	},
	saveUser: function(error,username,password) {
		if (error) {
			return {'error':error};
		}

		var user = {
			username: username,
			password: sha1(password)
		};

		var alreadyExists = this.findByUsername(null,user.username);
		console.log('existe',alreadyExists);
		if (alreadyExists) {
			return {'error': 'User already exists'}
		}

		return this.users.insert(user);
	},
	findByUsername: function(error,username) {
		// Para verificar si el usuario existe
		if (error) {
			return {'error':error};
		}
		
		var user = this.users.find({username:username});
		console.log(_.chain(user).some().value());
		return _.chain(user).some().value();
	}
}