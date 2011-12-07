var SSHHost = require('./sshHost').SSHHost, Container = require('./container').Container, htmlDecode = require('./encoder').htmlDecode, log = require('czagenda-log').from(__filename), path = require('path');

const PVE_DATA = '/var/lib/vz/';

function Host(ip, options) {
	this.ip = ip;
	this.user = 'root';
	this.containers = null;
	this.maxCtid = null;
	this.types = {};
}

Host.prototype.registerType = function(module) {
	
	if (typeof(module.type) == 'undefined') {
		throw new Error('Class must define a static attribute type')
	}
	
	this.types[module.type] = module;
}
Host.prototype.scpTo = function(local, remote, veid, callback) {
	var h = new SSHHost(this.ip, this.user);
	h.scpTo(local, path.join(PVE_DATA, 'private', String(veid), remote), callback);
}

Host.prototype.updateVzinfo = function(callback) {
	var h = new SSHHost(this.ip, this.user);
	h.scpTo(path.join(path.dirname(__filename), '../ressources/vzinfo.py'), '/root/', callback);

}

Host.prototype._constructContainer = function(data) {
		
	var class_name = null;
	try {
		description = JSON.parse(data.description)
		class_name = description.type
	} catch(e) {

	}
	if(class_name != null) {
		clazz = this.types[class_name];
		//require('./containers/'+class_name).Container;
		if( typeof (clazz) === "undefined") {
			clazz = Container;
		}
	} else {
		clazz = Container;
	}
	
	return new clazz(data, this);

}

Host.prototype.getContainers = function(callback) {
	var h = new SSHHost(this.ip, this.user);
	h.ssh('python /root/vzinfo.py', null, function(err, res, code) {
		if(err) {
			if(err === "python: can't open file '/root/vzinfo.py': [Errno 2] No such file or directory") {
				log.info('Auto-install vzinfo.py');
				
				this.updateVzinfo( function(err, res) {
					if(err) {
						callback(err);
					} else {
						this.getContainers(callback);
					}
				}.bind(this))
			}
			return;
		}
		var containers = [];
		if(err) {
			callback(err);
		}
		res = JSON.parse(res);

		for(var i = 0, l = res.length; i < l; i++) {
			
			containers.push(this._constructContainer(res[i]));
		};
		this.containers = containers;
		callback(err, containers);
	}.bind(this));
}

Host.prototype.getContainer = function(options, callback) {
	var h = new SSHHost(this.ip, this.user);
	
	var cmd = 'python /root/vzinfo.py ';
	
	if (typeof(options.hostname) !== 'undefined') {
		cmd += '--hostname=' + options.hostname;
	} else if (typeof(options.id) !== 'undefined')  {
		cmd += '--ctid=' + options.id;
	} else {
		callback(new Error('Options not supported ' + JSON.stringify(options)));
		return;
	}
	
	h.ssh(cmd, null, function(err, res, code) {
		if(err !== null) {
			if(err === "python: can't open file '/root/vzinfo.py': [Errno 2] No such file or directory") {
				log.info('Auto-install vzinfo.py');
				
				this.updateVzinfo( function(err, res) {
					if(err) {
						callback(err);
					} else {
						this.getContainer(options, callback);
					}
				}.bind(this))
			}
			return;
		}
		var containers = [];
		
		if(err !== null) {
			callback(err);
		}
		
		res = JSON.parse(res);
		
		if (res.length === 0) {
			callback(new Error('Not found'));
			return;
		}
		
		callback(err, this._constructContainer(res[0]));
	}.bind(this));
}


Host.prototype.vzctl = function(command, options, callback) {

	var h = new SSHHost(this.ip, this.user);
	h.ssh('vzctl ' + command.join(' '), options, function(err, res, code) {
		callback(err, res);
	});
}
Host.prototype.getAvailableCTID = function(callback) {
	if(this.containers == null) {
		this.getContainers( function() {
			this._getAvailableCTID(callback);
		}.bind(this));
	} else {
		this._getAvailableCTID(callback);
	}
}

Host.prototype._getAvailableCTID = function(callback) {
	if(this.maxCtid == null) {
		this.maxCtid = 100;
		for(var i = 0, l = this.containers.length; i < l; i++) {
			if(this.containers[i].id > this.maxCtid) {
				this.maxCtid = this.containers[i].id;
			}
		}
	}
	this.maxCtid += 1;
	callback(null, this.maxCtid);
}
exports.Host = Host;
