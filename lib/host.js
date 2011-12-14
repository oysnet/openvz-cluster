var SSHHost = require('./sshHost').SSHHost, Container = require('./container').Container, htmlDecode = require('./encoder').htmlDecode, log = require('czagenda-log')
		.from(__filename), path = require('path'), errors = require('./errors'), ContainerTypes = require('./containerTypes'), util = require('util'), EventEmitter = require('events').EventEmitter;

const PVE_DATA = '/var/lib/vz/';

const BIN_VZINFO = 'python /root/vzTools/vzinfo.py';
const BIN_VZEXEC = 'python /root/vzTools/vzexec.py';

function Host(ip, options) {
	this.ip = ip;
	this.init = false;
	this.__waitingInit = [];
	this.user = 'root';
	this.containers = [];
	this.maxCtid = null;
	this.__firstSeen = {}; // used to store the date of first time the vm was
							// seen if the vm has no type.
	this.__refrechInterval = setInterval(this._refreshContainers.bind(this),
			1000);
}
util.inherits(Host, EventEmitter);

Host.prototype._refreshContainers = function() {

	var h = new SSHHost(this.ip, this.user);
	h.ssh(BIN_VZINFO, {
				debug : false
			}, function(err, res, code) {
				if (err) {
					if (err === "python: can't open file '/root/vzTools/vzinfo.py': [Errno 2] No such file or directory") {

						this._updateVzinfo(function(err, res) {
									if (err) {
										// toto
										// callback(err);
									} else {
										this._refreshContainers();
									}
								}.bind(this))
					}
					return;
				}
				res = JSON.parse(res);
				var containers = []
				for (var i = 0, l = res.length; i < l; i++) {
					
					if (this._constructContainer(res[i]) === true) {
						containers.push(parseInt(res[i].id));
					}

				};
				var toRemove = [];
				for (var i = 0, l = this.containers.length; i < l; i++) {
					if (containers.indexOf(this.containers[i].id) === -1) {
						log.debug('container removed');
						toRemove.push(i);
						this.emit('removeContainer', this.containers[i]);
					}
				}
				for (var i = 0, l = toRemove.length; i < l; i++) {
					this.containers.splice(toRemove[i], 1)
				}

				var init = true;
				var currentTime = (new Date()).getTime()
				for (var ctid in this.__firstSeen) {

					if (currentTime - this.__firstSeen[ctid] < 2000) {
						init = false;
					}

				}

				if (init === true) {
					this.__setInit();
				}

			}.bind(this));
}

Host.prototype.afterInit = function(callback) {
	if (this.init === true) {
		callback();
	} else {
		this.__waitingInit.push(callback);
	}
}

Host.prototype.__setInit = function() {
	if (this.init === true) {
		return;
	}
	this.init = true;
	var wi = this.__waitingInit.splice(0, this.__waitingInit.length);
	for (var i = 0, l = wi.length; i < l; i++) {
		wi[i]();
	}
}

Host.prototype.scpTo = function(local, remote, veid, callback) {
	var h = new SSHHost(this.ip, this.user);
	h.scpTo(local, path.join(PVE_DATA, 'private', String(veid), remote),
			callback);
}

Host.prototype._updateVzinfo = function(callback) {
	log.info('Auto-install vzinfo.py');
	var h = new SSHHost(this.ip, this.user);
	h.scpTo(path.join(path.dirname(__filename), '../ressources/vzTools/'),
			'/root/', callback);
}
Host.prototype.getContainerById = function(id) {
	var id = parseInt(id);
	for (var i = 0, l = this.containers.length; i < l; i++) {
		if (this.containers[i].id === id) {
			return this.containers[i]
		}
	}
	return null;
}
Host.prototype._constructContainer = function(data) {

	var container = this.getContainerById(data.id)
	if (container === null) {

		var class_name = null;
		try {
			description = JSON.parse(data.description)
			class_name = description.type
		} catch (e) {

		}
		if (class_name != null) {
			clazz = ContainerTypes.getClass(class_name);
			if (clazz === null) {
				clazz = Container;
			}
		} else {

			if (typeof(this.__firstSeen[data.id]) === 'undefined') {

				this.__firstSeen[data.id] = (new Date()).getTime();
				return false;

			} else if ((new Date()).getTime() - this.__firstSeen[data.id] < 2000) {
				return false
			} else {
				delete this.__firstSeen[data.id];
			}

			clazz = Container;
		}

		container = new clazz(data, this);
		this.containers.push(container);
		log.debug('new container added id: ' + data.id + ' type: ' + class_name
				+ ' class: ' + clazz.type);
		this.emit('addContainer', container);
	} else {
		container.refreshInfo(data);
	}

	return true;
}

Host.prototype.getContainers = function() {
	log.info("get Containers is deprecated, access host.containers");
}

Host.prototype.getContainersByType = function(clazz, strict) {
	var results = [];
	for (var i = 0, l = this.containers.length; i < l; i++) {
		if (strict === true
				&& this.containers[i].constructor.type === clazz.type) {
			results.push(this.containers[i]);

		} else if (this.containers[i] instanceof clazz) {
			results.push(this.containers[i]);
		}
	}
	return results;
}

Host.prototype.vzctl = function(command, options, callback) {

	var h = new SSHHost(this.ip, this.user);
	h.ssh('vzctl ' + command.join(' '), options, function(err, res, code) {
				if (callback) {
					callback(err, res);
				}
			});
}

Host.prototype.vzexec = function(command, options, callback) {

	var h = new SSHHost(this.ip, this.user);
	console.log(BIN_VZEXEC + ' ' + command.join(' '))
	h.ssh(BIN_VZEXEC + ' ' + command.join(' '), options, function(err, res,
					code) {
				if (callback) {
					callback(err, res);
				}
			});
}

Host.prototype.getAvailableCTID = function(callback) {
	if (this.containers == null) {
		this.getContainers(function() {
					this._getAvailableCTID(callback);
				}.bind(this));
	} else {
		this._getAvailableCTID(callback);
	}
}

Host.prototype._getAvailableCTID = function(callback) {
	if (this.maxCtid == null) {
		this.maxCtid = 100;
		for (var i = 0, l = this.containers.length; i < l; i++) {
			if (this.containers[i].id > this.maxCtid) {
				this.maxCtid = this.containers[i].id;
			}
		}
	}
	this.maxCtid += 1;
	callback(null, this.maxCtid);
}
exports.Host = Host;
