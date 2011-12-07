var Host = require('../lib/host').Host;

var Gitolite = require('../lib/containers/gitolite').Container;
var Container = require('../lib/container').Container;
var async = require('async');

var h = new Host('10.7.35.110');

h.getContainer({id:120}, function (err, ctn) {
	ctn.isAlive(function (err, alive) {
		console.log(alive);
	});
})
