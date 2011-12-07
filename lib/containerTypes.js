
var types = {};

function register(module) {
	if (typeof(module.type) == 'undefined') {
		throw new Error('Class must define a static attribute type')
	}

	types[module.type] = module;
}

function getClass (type) {
	
	if (typeof(types[type]) === 'undefined') {
		return null;
	}
	
	return types[type];
	
}

exports.register = register;
exports.getClass = getClass;