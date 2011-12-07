var errors = require('./errors');
var async = require('async');

function HostManager() {
	this.hosts = [];
	this._cache = {};
}

module.exports = HostManager;

HostManager.prototype.hosts = null;
HostManager.prototype._cache = null;

HostManager.prototype.register = function(host, callback) {

	this._getContainers(host, function(err, res) {

				if (err === null) {
					this.hosts.push(host);
				}

				callback(err, res)

			}.bind(this));

}

HostManager.prototype.getContainers = function() {
	var options = null;
	var callback = null;

	if (arguments.length === 2) {
		options = arguments[0];
		callback = arguments[1];
	} else {
		callback = arguments[0];
	}

	var findContainer = function(host) {

		return function(cb) {

			host.getContainers(options, function(err, ctns) {

						if (err !== null) {
							cb(err);
							return;
						}

						cb(null, ctns)

					}.bind(this));
		}.bind(this);
	}.bind(this);

	var asyncMethods = [];

	for (var i = 0, l = this.hosts.length; i < l; i++) {
		asyncMethods.push(findContainer(this.hosts[i]))
	}

	
	async.parallel(asyncMethods, function(err, results) {
				if (err !== null && typeof(err) !== 'undefined') {
					callback(err);
					return;
				}
				
				var containers = [];
				for (var i =0,l=results.length;i<l;i++) {
					containers = containers.concat(results[i]);
				}
				callback(null, containers);				
				
			}.bind(this));

}

HostManager.prototype.getContainer = function(options, callback) {

	if (typeof(options.id) === 'undefined') {
		callback(new Error('unknow options'))
	}

	var ctnId = options.id;

	// get container from cached host
	if (typeof(this._cache[ctnId]) !== 'undefined') {

		this._cache[ctnId].getContainer({
					id : ctnId
				}, function(err, container) {

					if (err !== null) {

						if (err instanceof errors.ContainerNotFound) {
							delete this._cache[ctnId];
							this.getContainer(ctnId, callback);
						} else {
							callback(err);
						}

						return;
					}

					callback(null, container);

				}.bind(this));

	}
	// find container throught all host
	else {

		var findContainer = function(host) {

			return function(cb) {

				host.getContainer({
							id : ctnId
						}, function(err, container) {

							if (err === null) {
								this._cache[ctnId] = host;
								callback(null, container);
								cb();
							}

						}.bind(this));
			}.bind(this);
		}.bind(this);

		var asyncMethods = [];

		for (var i = 0, l = this.hosts.length; i < l; i++) {
			asyncMethods.push(findContainer(this.hosts[i]))
		}

		async.parallel(asyncMethods, function() {

					if (typeof(this._cache[ctnId]) === 'undefined') {
						callback(new errors.ContainerNotFound(ctnId));
					}

				}.bind(this));

	}

}

HostManager.prototype._getContainers = function(host, callback) {

	host.getContainers(function(err, containers) {

				if (err !== null) {
					callback(err);
					return;
				}

				for (var i = 0, l = containers.length; i < l; i++) {
					this._cache[containers[i].id] = host;
				}

				callback(null, containers.length);

			}.bind(this));

}