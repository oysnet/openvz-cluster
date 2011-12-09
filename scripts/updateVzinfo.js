var Host = require('../lib/host').Host;

var h = new Host('10.7.35.110');

h._updateVzinfo(function () {
	
	console.log(arguments);
	
})
