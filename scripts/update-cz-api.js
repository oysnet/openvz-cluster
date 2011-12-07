var Host = require('../lib/host').Host;

var Gitolite = require('../lib/containers/czagendaapi').Container;
var Container = require('../lib/container').Container;
var async = require('async');

var h = new Host('10.7.35.110');

h.registerType(Gitolite);

h.getContainers(function (err, containers) {
	for (var i = 0, l = containers.length; i<l;i++) {
		
		if ([120,123,124].indexOf(containers[i].id) !== -1) {
						
			containers[i].updateServer(function (err, res) {
			
				if (err !== null) {
					console.log('error on container ' + containers[i].id, err)
				} else {
					console.log(res)
				}
			})
		}
		
	}
})
