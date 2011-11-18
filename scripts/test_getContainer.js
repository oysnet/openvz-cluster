var Host = require('../lib/host').Host;

var Czagendaapi = require('../lib/containers/czagendaapi').Container;
var Container = require('../lib/container').Container;
var async = require('async');

var h = new Host('10.7.35.110');

h.registerType(Czagendaapi);

h.getContainer({id:136}, function (err, ctn) {
	ctn.start(function () {
		console.log(arguments)
	})
})
