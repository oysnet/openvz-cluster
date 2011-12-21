var errors = require('./errors'), util = require('util'), EventEmitter = require('events').EventEmitter, async = require('async');

function Cluster() {
	this.hosts = [];
	for (var i = 0, l = arguments.length; i < l; i++) {
		this.register(arguments[i]);
	}
	this.init = false;
	this.__waitingInit = [];
	this.defaultNetworkAddress = '10.7.35.0';
	this.nameServerAddress = '10.7.35.254';

	this.reservedCTIDS = [];

}

util.inherits(Cluster, EventEmitter);

Cluster.prototype.register = function(host) {
	this.init = false;
	this.hosts.push(host);
	host.cluster = this;
	host.afterInit(this._checkInit.bind(this));
	host.on('addContainer', function(container) {

				if (this.reservedCTIDS.indexOf(container.id) !== -1) {
					this.reservedCTIDS.splice(this.reservedCTIDS
									.indexOf(container.id), 1);
				}

				this.emit('addContainer', container);
			}.bind(this));
	host.on('removeContainer', function(container) {

				if (this.reservedCTIDS.indexOf(container.id) !== -1) {
					this.reservedCTIDS.splice(this.reservedCTIDS
									.indexOf(container.id), 1);
				}

				this.emit('removeContainer', container);
			}.bind(this));

}
Cluster.prototype._checkInit = function() {
	init = true;
	for (var i = 0, l = this.hosts.length; i < l; i++) {
		if (this.hosts[i].init === false) {
			init = false;
			break;
		}
	}
	this.init = init;
	if (this.init === false) {
		return;
	} else {
		var wi = this.__waitingInit.splice(0, this.__waitingInit.length);
		for (var i = 0, l = wi.length; i < l; i++) {
			wi[i]();
		}
	}
}
Cluster.prototype.afterInit = function(callback) {
	if (this.init === true) {
		callback();
	} else {
		this.__waitingInit.push(callback);
	}
}

Cluster.prototype.getContainerById = function(id) {
	var container = null;
	for (var i = 0, l = this.hosts.length; i < l; i++) {
		var container = this.hosts[i].getContainerById(id);
		if (container !== null) {
			return container
		}
	}
	return container;
}
Cluster.prototype.getContainersByType = function(clazz) {
	var res = [];

	for (var i = 0, l = this.hosts.length; i < l; i++) {
		var containers = this.hosts[i].getContainersByType(clazz);
		if (containers !== null) {

			res = res.concat(containers);
		}
	}

	return res;
}

Cluster.prototype.getAvailableCTID = function(callback) {

	var methods = [];

	var availableCTID = null;

	this.hosts.forEach(function(host) {
				methods.push(host.getMaxCTID.bind(host))
			}.bind(this))

	async.parallel(methods, function(err, res) {

				if (err) {
					callback(err);
					return;
				}

				res.sort(function(x, y) {
							return x < y ? 1 : -1
						});

				var availableCtid = res[0] + 1;

				while (this.reservedCTIDS.indexOf(availableCtid) !== -1) {
					availableCtid++;
				}

				this.reservedCTIDS.push(availableCtid);
				callback(null, availableCtid);

			}.bind(this))

}

exports.Cluster = Cluster;
