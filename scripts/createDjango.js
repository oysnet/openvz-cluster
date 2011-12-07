var Host = require('../lib/host').Host;

var Django = require('../lib/containers/django').Container;
var Gitolite = require('../lib/containers/gitolite').Container;
var Container = require('../lib/container').Container;
var async = require('async');

var h = new Host('10.7.35.110');

h.registerType(Django);
h.registerType(Gitolite);

var name = "refer";
var repos = null;
/*
 var ctn = new Django({
 hostname : 'django.oxys.net'
 }, h);
 ctn.setup(function(err) {

 if(err !== null) {
 console.log(err);
 return;
 }
 });*/

var gitolite = null;
var django = null;

var gitolite = new Gitolite({
	hostname : 'git.pau.oxys.net'
}, h);

gitolite.setup(function(err, res) {
	if(err !== null) {
		console.log(err);
		return;
	}

	var ctn = new Django({
		hostname : name + '.django.oxys.net'
	}, h);
	ctn.setup(function(err) {

		if(err !== null) {
			console.log(err);
			return;
		}
		django = ctn;
		
		repos = [django.id,name].join('.');
		
		gitolite.addRepository(repos, function(err, res) {
			if(err !== null) {
				console.log(err);
				return;
			}

			django.getPublicKey(function(err, key) {
				if(err !== null) {
					console.log(err);
					return;
				}

				gitolite.addUser(django.id, key, function(err, res) {
					if(err !== null) {
						console.log(err);
						return;
					}

					gitolite.addUserInGroup(django.id, repos, function(err, res) {
						if(err !== null) {
							console.log(err);
							return;
						}

						django.createProject(name, gitolite.ip, repos, function(err, res) {
							if(err !== null) {
								console.log(err);
								return;
							}

							console.log('done')
						})
					})
				})
			})
		});
	})
})