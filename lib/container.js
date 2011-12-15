var async = require('async'), encoder = require('./encoder').encoder, path = require('path'), log = require('czagenda-log')
		.from(__filename), exec = require('child_process').exec, EventEmitter = require('events').EventEmitter, IpMonitor = require('./tools/ipMonitor').IpMonitor;
var util = require("util");

const NAME_SERVER = '10.7.35.254';
const DEFAULT_TEMPLATE = 'debian-6.0-standard_6.0-4_i386';

function Container(info, host) {
	this.host = host;
	this.id = parseInt(info.id);
	this.ip = info.ip;
	this.swap = info.swap;
	this.ram = info.ram;
	this.vmStatus = info.vmStatus;
	this.status = null;
	this.hostname = info.hostname;
	this.description = info.description;
	this.network = Container.NETWORK.VENET;
	this.ipMonitor = null;
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

util.inherits(Container, EventEmitter);
Container.type = 'Container';

Container.prototype.refreshInfo = function(info) {
	var attrs = ['ip', 'swap', 'vmStatus', 'ram', 'hostname'];
	for (var i = 0, l = attrs.length; i < l; i++) {
		
		if (typeof(info[attrs[i]]) == 'undefined') {
			continue;
		}
		
		var old = this[attrs[i]];
		var value = info[attrs[i]];
		this[attrs[i]] = value;

		if (old !== value) {
			this.emit(
					'change' + attrs[i][0].toUpperCase() + attrs[i].substr(1),
					value, old)
					
		}

	}
	
	var old = this.status;
	var value = (info.vmStatus === Container.VMSTATUS.RUNNING && (this.ipMonitor !== null ? this.ipMonitor.status === IpMonitor.STATUS.UP : null))
			? Container.STATUS.UP
			: Container.STATUS.DOWN;
			
	this.status = value;
	if (old !== value) {
		this.emit('changeStatus', value, old)
	}
}

Container.prototype.promote = function(callback) {
	log.debug('not implemented - promote container to master on a ha system')
	callback(null)
}

Container.prototype.demote = function(callback) {
	log.debug('not implemented - demote container on a ha system')
	callback(null)
}

Container.prototype.addListener = function(event, listener) {

	EventEmitter.prototype.addListener.call(this, event, listener);
	if (event === 'changeStatus') {
		if (this.ipMonitor === null) {
			this.ipMonitor = new IpMonitor(this.getIp());
			this.ipMonitor.on('changeStatus', function(status) {
				var old = this.status;
				this.status = (status === IpMonitor.STATUS.UP && this.vmStatus === Container.VMSTATUS.RUNNING)
						? Container.STATUS.UP
						: Container.STATUS.DOWN;

				if (old !== this.status) {
					
					this.emit('changeStatus', this.status, old);
				}

			}.bind(this));

		}
		this.ipMonitor.start();
	}

}

Container.prototype.on = Container.prototype.addListener;

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
		if (typeof(callback) === 'undefined' || callback === null) {
			callback = function() {
			};
		}
		// timeout to prevent locked vm
		setTimeout(function() {

					if (err !== null) {
						this.description.status = Container.VMSTATUS.FAIL_TO_START;
						this.saveDescription(function() {
									callback(err, res);
								})
					} else {
						callback(err, res);
					}

				}.bind(this), 1000);

	}.bind(this));
}

Container.prototype.addIp = function(ip, save, callback) {

	save = save === true;

	var cb = function(err, res) {

		if (err) {
			callback(err);
			return;
		};

		if (this.ip.indexOf(ip) === -1) {
			this.ip.push(ip);
		}

		callback(err, res);
	}.bind(this);

	var command = ['set', this.id, '--ipadd', ip];
	if (save === true) {
		command.push('--save');
	}
	if (this.network === Container.NETWORK.VETH) {

		this.host.vzexec(command, null, cb)

	} else {
		this.host.vzctl(command, null, cb);
	}

}
Container.prototype.removeIp = function(ip, save, callback) {
	/*
	 * if (this.network !== Container.NETWORK.VENET) { throw "Can't add ip for
	 * this type of netword"; }
	 */
	// this.host.vzctl(['set', this.id, '--ipdel', ip, '--save'], null,
	// callback);
	save = save === true;

	var cb = function(err, res) {

		if (err) {
			callback(err);
			return;
		};

		if (this.ip.indexOf(ip) === -1) {
			this.ip.push(ip);
		}

		callback(err, res);
	}.bind(this);

	var command = ['set', this.id, '--ipdel', ip];
	if (save === true) {
		command.push('--save');
	}

	if (this.network === Container.NETWORK.VETH) {

		this.host.vzexec(command, null, cb)

	} else {
		this.host.vzctl(command, null, cb);
	}

}
Container.prototype.backup = function(callback) {
	callback(null);
}

Container.prototype.getSetupTasks = function() {
	return [];
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
				this.hostname = 'vm' + this.id + '.'
						+ this.constructor.type.toLowerCase() + '.cl.oxys.net';
			}
			if (this.ip === undefined) {
				// @todo this.id > 254
				if (this.id > 253) {
					throw "Can't set ip //@todo this.id > 254";
				}
				this.ip = ['10.7.50.' + this.id];
			}

			this.description.type = this.constructor.type;
			this.description.status = Container.VMSTATUS.CREATED;

			if (this.ostemplate === null) {
				// @todo check existing template
				// "/var/lib/vz/template/cache/debian-6.0-standard_6.0-4_i386.tar.gz"
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

		'set_status_installing' : function(callback) {
			this.description.status = Container.VMSTATUS.INSTALLING;
			this.saveDescription(logCallback.bind(this, callback,
					'Set status INSTALLING'));
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

			if (this.network === Container.NETWORK.VENET) {

				this
						.addIp(this.ip[0], true, logCallback.bind(this,
										callback,
										'Configure venet device with ip '
												+ this.ip[0])); // todo
				// multiple
				// ip

			} else {
				// @todo debian only ! + multiple ip
				async.series([
								function(callback) {
									this.host.vzctl(['set', this.id,
													'--netif_add', 'eth0',
													'--save'], null, callback);
								}.bind(this), this.start.bind(this),
								function(callback) {

									this.addIp(this.ip[0], true,
											logCallback.bind(this, callback,
													'Configure veth device with ip '
															+ this.ip[0]));

								}.bind(this), this.stop.bind(this)],
						logCallback.bind(this, callback,
								'Configure veth device with ip ' + this.ip[0]));
			}
		}.bind(this),

		'start' : function(callback) {
			this.start(logCallback.bind(this, callback, 'Start container '
							+ this.id));
		}.bind(this),

		'do_extra_setup_tasks' : function(callback) {

			var tasks = this.getSetupTasks();
			if (tasks.length > 0) {

				async.series(tasks, function(err) {
							callback(err);
						})

			} else {
				callback();
			}

		}.bind(this),

		'set_status_installed' : function(callback) {
			this.description.status = Container.VMSTATUS.INSTALLED;
			this.saveDescription(logCallback.bind(this, callback,
					'Set status INSTALLED'));
		}.bind(this)

	}, function(err, res) {

		if (err) {

			if (err.indexOf('Private area already exists') !== -1) {
				callback(err, res);
				return;
			}

			if (this.description.status === Container.VMSTATUS.CREATED) {
				this.description.status = Container.VMSTATUS.FAIL_TO_CREATE;
			} else if (this.description.status === Container.VMSTATUS.INSTALLING) {
				this.description.status = Container.VMSTATUS.FAIL_TO_INSTALL;
			}
		}

		this.saveDescription(function() {
					callback(err, res);
				})

	}.bind(this));
}
Container.NETWORK = {
	'VENET' : 'venet',
	'VETH' : 'veth'
}

Container.VMSTATUS = {
	'STOPPED' : 0,
	'RUNNING' : 1,
	'MOUNTED' : 2,
	'SUSPENDED' : 3,
	'CREATED' : 4,
	'INSTALLING' : 5,
	'INSTALLED' : 6,
	'FAIL_TO_CREATE' : 7,
	'FAIL_TO_INSTALL' : 8,
	'FAIL_TO_START' : 9
}
Container.STATUS = {
	'UP' : 'UP',
	'DOWN' : 'DOWN'
}

exports.Container = Container