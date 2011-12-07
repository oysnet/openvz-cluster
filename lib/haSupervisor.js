var containerTypes = require('./containerTypes');
var log = require('czagenda-log')
		.from(__filename);
	
	var async = require('async');
		
function HASupervisor(hostManager, options) {
	this.hostManager = hostManager;
	this.containers = {};
	this.multipleMasters = [];
	
	if (typeof(options) === 'undefined' || options === null) {
		throw new error('options must be defined')
	}

	if (containerTypes.getClass(options.type) === null) {
		throw new Error('Is not a registered container type: ' + options.type);
	}

	if (typeof(options.masterIP) === 'undefined') {
		throw new Error('options.masterIP must be defined');
	}

	this.supervisedType = options.type;
	this.masterIP = options.masterIP;
	
}

module.exports = HASupervisor;

HASupervisor.UP = 1;
HASupervisor.DOWN = 0;

HASupervisor.prototype.hostManager = null;
HASupervisor.prototype.containers = null;
HASupervisor.prototype.masterContainerId = null;
HASupervisor.prototype.supervisedType = null;
HASupervisor.prototype.masterIP = null;
HASupervisor.prototype.frequency = 1000;

HASupervisor.prototype.multipleMasters = null;

HASupervisor.prototype.isMaster = function(container) {
	return container.ip.indexOf(this.masterIP) !== -1;
}

HASupervisor.prototype.promote = function(container) {
	
}

HASupervisor.prototype.demote = function(container) {
	
}

HASupervisor.prototype.start = function(callback) {
	setInterval(this.__checkState.bind(this), this.frequency);
}

HASupervisor.prototype.__checkState = function() {
	this.refreshContainerList(function(err, done) {

				// check master
				if (this.masterContainerId !== null && typeof(this.containers[this.masterContainerId]) !== 'undefined') {
					// check if alive
					
					// if alive && multipleMasters.length > 0
					// => demote all multipleMasters.length
					// => multipleMasters = []
					
					// findMaster
					
				} else {
					
					// findMaster
					
				}

			}.bind(this))
}


HASupervisor.prototype.__findMaster = function () {

}

HASupervisor.prototype.__refreshStatus = function (callback) {
	
	var asyncMethods = [];
	
	var testContainer = function (ctnId) {
		return function (cb) {
			this.containers[ctnId].container.isAlive(function (err, alive) {
				
				this.containers[ctnId].status = (err !== null && alive === true) ? HASupervisor.UP : HASupervisor.DOWN; 
				cb();			
			}.bind(this));
		} 
	}.bind(this)
	
	for (var ctnId in this.containers) {
		asyncMethods.push(testContainer(ctnId))
	}
	
	async.parallel(asyncMethods, function (err) {
		callback()
	})
	
}

HASupervisor.prototype.refreshContainerList = function(callback) {

	this._findContainers(function(err, containers) {

				if (err !== null) {
					callback(err);
					return;
				}

				var ids = [];

				for (var i = 0, l = containers.length; i < l; i++) {
					this._addContainer(containers[i]);
					ids.push(containers[i].id)
					
					if (this.isMaster(containers[i]) === true && this.masterContainerId !== containers[i].id) {
							this.multipleMasters.push(containers[i].id);
					}
				}
				
				// remove containers that are not actually found
				for (var k in this.containers) {
					if (ids.indexOf(k) === -1) {
						delete this.containers[k];
					}
				}
				
				callback(null, true);

			}.bind(this))

}

HASupervisor.prototype._findContainers = function(callback) {

	this.hostManager.getContainers({
				type : this.supervisedType
			}, callback);

}

HASupervisor.prototype._addContainer = function(container) {

	if (typeof(this.containers[ctnId]) === 'undefined') {
		this.containers[container.id] = {
			status : null,
			//isMaster : null,
			container : container
		}
	} else {
		this.containers[container.id].container = container;
	}
}
