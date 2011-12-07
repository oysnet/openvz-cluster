var async = require('async'), encoder = require('./encoder').encoder, path = require('path'), log = require('czagenda-log')
		.from(__filename), exec = require('child_process').exec;

const NAME_SERVER = '10.7.35.254';
const DEFAULT_TEMPLATE = 'debian-6.0-standard_6.0-4_i386';

function Container(info, host) {
	this.host = host;
	this.id = parseInt(info.id);
	this.ip = info.ip;
	this.swap = info.swap;
	this.ram = info.ram;
	this.status = info.status
	this.hostname = info.hostname;
	this.description = info.description;
	this.network = 'venet';
	this.exec_queue = async.queue(this._exec.bind(this), 3);
	if (typeof(this.description) === 'undefined') {
		this.description = {};
	}

	if (typeof(this.swap) === 'undefined') {
		this.swap = 128;
	}
	if (typeof(this.ram) === 'undefined') {
		this.ram = 128;
	}
	this.ostemplate = null;
}

Container.prototype.isAlive = function(callback) {
	
	exec("ping -W 200 -c 1 " + this.getIp(), function puts(error, stdout,
			stderr) {
		
				callback(null, error === null)

	});
}

Container.prototype.exec = function(command, options, callback) {
	this.exec_queue.push({
				command : command,
				options : options
			}, callback);
}

Container.prototype._exec = function(task, callback) {
	this.host.vzctl(['exec2', this.id,
					'"' + task.command.replace(/"/g, '\\"') + '"'],
			task.options, callback);
}

Container.prototype.scpTo = function(local, remote, callback) {
	this.host.scpTo(local, remote, this.id, callback);
}

Container.prototype.getIp = function() {
	return '10.7.50.' + this.id;

}
Container.prototype.saveDescription = function(callback) {

	if (typeof(this.constructor.type) == 'undefined') {
		callback(new Error('Container class must have a static attribute type'));
		return;
	}

	this.description.type = this.constructor.type;

	this.host.vzctl([
					'set',
					this.id,
					'--description',
					'"' + encoder.htmlEncode(JSON.stringify(this.description))
							+ '"', '--save'], null, callback);
}

Container.prototype.setRam = function setRam(ram, callback) {
	this.ram = ram;
	this.host.vzctl(['set', this.id, '--lockedpages',
					this.ram + 'M:' + this.ram + 'M', '--save'], null,
			function(err, res) {
				if (err) {
					log.warning('setRam failed', err);
					if (callback) {
						callback(err)
					}
					return;
				} else {
					log.info('Ram changed for container ' + this.id + ' ('
							+ ram + 'M)');
				}
				this.setSwap(this.swap, callback);
			}.bind(this));

}
Container.prototype.setSwap = function(swap, callback) {
	this.swap = swap;
	async.series([function(callback) {
				this.host.vzctl([
								'set',
								this.id,
								'--privvmpages',
								(this.swap + this.ram) + 'M:'
										+ (this.swap + this.ram) + 'M',
								'--save'], null, callback);
			}.bind(this), function(callback) {
				this.host.vzctl([
								'set',
								this.id,
								'--oomguarpages',
								(this.swap + this.ram)
										+ 'M:9223372036854775807', '--save'],
						null, callback);
			}.bind(this), function(callback) {
				this.host.vzctl([
								'set',
								this.id,
								'--vmguarpages',
								(this.swap + this.ram)
										+ 'M:9223372036854775807', '--save'],
						null, callback);
			}.bind(this)], callback);
}

Container.prototype.stop = function(callback) {
	this.host.vzctl(['stop', this.id], null, function(err, res) {
				if (callback) {
					callback(err, res);
				}
			});
}

Container.prototype.start = function(callback) {
	this.host.vzctl(['start', this.id], null, function(err, res) {
				if (callback) {
					setTimeout(function() {
								callback(err, res);
							}, 1000);
				}
			});
}

Container.prototype.addIp = function(ip, callback) {
	if (this.network !== 'venet') {
		throw "Can't add ip for this type of netword";
	}
	this.host.vzctl(['set', this.id, '--ipadd', ip, '--save'], null, callback);
}
Container.prototype.removeIp = function(ip, callback) {
	if (this.network !== 'venet') {
		throw "Can't add ip for this type of netword";
	}
	this.host.vzctl(['set', this.id, '--ipdel', ip, '--save'], null, callback);
}
Container.prototype.backup = function(callback) {
	callback(null);
}

Container.prototype.setup = function(callback) {
	var logCallback = function(callback, message, err, res) {
		if (err) {
			log.warning(message + ' FAILED', err);
		} else {
			log.info(message, res);
		}
		callback(err, res);
	}
	async.series({
		'get_id' : function(callback) {
			this.host.getAvailableCTID(function(err, res) {
						this.id = res;
						logCallback(callback, 'Get new CTID', err, res);
					}.bind(this));
		}.bind(this),
		'init_data' : function(callback) {
			if (this.hostname === undefined) {
				this.hostname = this.id + '.cl.czagenda.org';
			}
			if (this.ip === undefined) {
				//@todo this.id > 254
				if (this.id > 253) {
					throw "Can't set ip //@todo this.id > 254";
				}
				this.ip = '10.7.50.' + this.id;
			}
			if (this.ostemplate === null) {
				//@todo check existing template "/var/lib/vz/template/cache/debian-6.0-standard_6.0-4_i386.tar.gz"
				this.ostemplate = DEFAULT_TEMPLATE;
			}
			callback();
		}.bind(this),
		'create' : function(callback) {
			log.info('Start creating new container with template '
					+ this.ostemplate);
			this.host.vzctl(
					['create', this.id, '--ostemplate', this.ostemplate], null,
					logCallback.bind(this, callback, 'Created new container'));
		}.bind(this),
		'set_onboot' : function(callback) {
			this.host.vzctl(['set', this.id, '--onboot', 'yes', '--save'],
					null, logCallback.bind(this, callback, 'Set onboot yes'));
		}.bind(this),
		'set_hostname' : function(callback) {

			if (this.hostname.indexOf(this.id) === -1) {
				this.hostname = [this.id, this.hostname].join('.');
			}

			this.host.vzctl(['set', this.id, '--hostname', this.hostname,
							'--save'], null, logCallback.bind(this, callback,
							'Set hostname'));
		}.bind(this),
		'set_nameserver' : function(callback) {
			this.host.vzctl(['set', this.id, '--nameserver', NAME_SERVER,
							'--save'], null, logCallback.bind(this, callback,
							'Set nameserver'));
		}.bind(this),
		'set_ip' : function(callback) {
			if (this.network === 'venet') {
				this.addIp(this.ip, logCallback.bind(this, callback,
								'Configure venet device with ip ' + this.ip));
			} else {
				//@todo debian only !
				async.series([function(callback) {
					this.host.vzctl(['set', this.id, '--netif_add', 'eth0',
									'--save'], null, callback);
				}.bind(this), this.start.bind(this), function(callback) {
					this.exec('echo "auto eth0">>/etc/network/interfaces',
							null, callback);
				}.bind(this), function(callback) {
					this
							.exec(
									'echo "iface eth0 inet static">>/etc/network/interfaces',
									null, callback);
				}.bind(this), function(callback) {
					this.exec('echo "address ' + this.ip
									+ '">>/etc/network/interfaces', null,
							callback);
				}.bind(this), function(callback) {
					this
							.exec(
									'echo "broadcast 10.7.50.255">>/etc/network/interfaces',
									null, callback);
				}.bind(this), function(callback) {
					this
							.exec(
									'echo "netmask 255.255.255.0">>/etc/network/interfaces',
									null, callback);
				}.bind(this), function(callback) {
					this
							.exec(
									'echo "up ip route add 10.7.35.254 dev eth0  scope link">>/etc/network/interfaces',
									null, callback);
				}.bind(this), function(callback) {

					this
							.exec(
									'echo "up ip route add default via 10.7.35.254 dev eth0">>/etc/network/interfaces',
									null, callback);
				}.bind(this), this.stop.bind(this),], logCallback.bind(this,
						callback, 'Configure veth device with ip ' + this.ip));
			}
		}.bind(this),
		'start' : function(callback) {
			this.start(logCallback.bind(this, callback, 'Start container '
							+ this.id));
		}.bind(this)
		,
	}, callback);
}

Container.STATUS = {
	'STOPPED' : 0,
	'RUNNING' : 1,
	'MOUNTED' : 3,
	'SUSPENDED' : 4
}

exports.Container = Container