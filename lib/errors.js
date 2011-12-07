var util = require("util");

function ContainerNotFound (message) {
	Error.call(this);	
	this.message = message;
}
util.inherits(ContainerNotFound, Error);
ContainerNotFound.prototype.name = 'ContainerNotFound';
exports.ContainerNotFound = ContainerNotFound;