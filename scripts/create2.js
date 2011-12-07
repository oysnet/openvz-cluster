var Host = require('../lib/host').Host;

var Django = require('../lib/containers/django').Container;
var Container = require('../lib/container').Container;
var async = require('async');

var h = new Host('10.7.35.110');

h.registerType(Django);


var node = new Django({hostname : 'czagenda-admin-tests.pau.oxys.net'}, h);
node.setup(function (err) {
	console.log(err)
});
