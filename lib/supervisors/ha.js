var log = require('czagenda-log').from(__filename), Container = require('./container').Container, async = require('async'), IpMonitor = require('./tools/ipMonitor').IpMonitor;

function HA(cluster, clazz, ip) {
	this.cluster = cluster;
	this.containers = [];
	this.status = null;
  this.masterStatus = null;
	this.__checking = false;
  this.ipMonitor = new IpMonitor(ip);
  this.cluster.on('addContainer', this.__addContainer.bind(this));
	this.cluster.on('removeContainer', this.__addContainer.bind(this));
	this.containers = {};
	this.ip = ip;
	this.clazz = clazz;
	this.__checkTimer = null;
	this.__bindedCheckStatus = this.__checkStatus.bind(this);
  this.ipMonitor.on('changeStatus',this.__computeStatus.bind(this));
  
  this.ipMonitor.start();
  var containers = cluster.getContainersByType(clazz);
  for (var i = 0, l = containers.length; i < l; i++) {
    this.__addContainer(containers[i]);
  }
  
  
}


HA.prototype.__computeStatus = function() {
  if(this.ipMonitor.status === IpMonitor.STATUS.UP && this.masterStatus === HA.STATUS.UP) {
    this.status = HA.STATUS.UP;
  } else if(this.masterStatus === HA.STATUS.ERROR ||(this.ipMonitor.status === IpMonitor.STATUS.DOWN && this.masterStatus === HA.STATUS.UP )) {
    this.status = HA.STATUS.ERROR;
  } else if(this.ipMonitor.status === IpMonitor.STATUS.DOWN && this.masterStatus === HA.STATUS.DOWN) {
    this.status = HA.STATUS.DOWN;
  }
  if(this.status  === HA.STATUS.UP) {
    log.info("CLUSTER STATUS : " + this.status)
  } else {
    log.error("CLUSTER STATUS : " + this.status)
  }
}

HA.prototype.__addContainer = function(container) {
	if (container.constructor.type != this.clazz.type) {
		return;
	}
	this.containers[container.id] = container;
	container.on('changeStatus', this.__bindedCheckStatus);
	this.__checkStatus();
}

HA.prototype.__removeContainer = function(container) {
	if (container.constructor.type !== this.clazz.type) {
		return;
	}
	container.removeListener('changeStatus', this.__bindedCheckStatus);

	delete this.containers[container.id];
	this.__checkStatus();
}

HA.prototype.__checkStatus = function() {
	if (this.__checkTimer !== null) {
		clearTimeout(this.__checkTimer);
	}
	this.__checkTimer = setTimeout(this.__doCheckStatus.bind(this), 500);
}

HA.prototype.__doCheckStatus = function() {
	if (this.__checking) {
		this.__checkStatus();
		return;
	}
	this.__checking = true;

	var masters = [];
	var slaves = [];
	var deads = [];
	for (var ctid in this.containers) {
		var c = this.containers[ctid];
    if (c.status === null) {
      this.__checking = false;
      this.__checkStatus();
      return;
    }
		if (c.status === Container.STATUS.UP) {
			if (c.ip.indexOf(this.ip) === -1) {
				slaves.push(c);
			} else {
				masters.push(c);
			}
		} else {
			deads.push(c);
		}

	}
	if (masters.length === 1 && masters[0].status === Container.STATUS.UP) {
		this.masterStatus = HA.STATUS.UP;
    this.__computeStatus();
		this.__checking = false;
	} else if (masters.length > 1) {
		var cids = [];
		for (var i = 0, l = masters.length; l < i; i++) {
			ctids.push(masters[i].id)
		}
		this.masterStatus = HA.STATUS.ERROR;
    this.__computeStatus();
		log.error('too many masters [' + ctids.join(',') + ']')
		this.__checking = false;
		return;
	} else if (slaves.length > 0) {
		var newMaster = slaves[0];
		var oldMaster = null;

		if (masters.length === 1) {
			oldMaster = masters[0];
		}

		async.series([function promoteNewMaster(callback) {
					newMaster.promote(callback);

				}.bind(this), function demoteOldMaster(callback) {
					if (oldMaster === null) {
						callback();
						return;
					}
					oldMaster.demote(callback);
				}.bind(this), function removeIpAll(callback) {
					var asyncList = [];
					for (var i = 0, l = deads.length; i < l; i++) {
						asyncList.push(function(deadContainer, callback) {
									deadContainer.removeIp(this.ip, function(
													err, res) {
												if (err !== null) {
													log
															.error('Error removing ip');
												}
												callback();
											})
								}.bind(this, deads[i]));
					}
					async.parallel(asyncList, function(err, res) {
								callback();
							});
					if (oldMaster !== null) {
						oldMaster.removeIp(this.ip, callback);
					}
				}.bind(this), function addIpNewMaster(callback) {
					newMaster.addIp(this.ip, Container.NETWORK.VENET, callback);
				}.bind(this)], function(err, callback) {
			this.__checking = false;
			if (err) {
				log.error('error setting master ' + err);
			}
			this.__checkStatus();
		}.bind(this));
	} else {
		this.masterStatus = HA.STATUS.DOWN;
    this.__computeStatus();
		log.error('no container available')
		this.__checking = false;
	}
}
HA.demote = function(container, callback) {
	container.demote(function(err, res) {
				if (err) {
					log.error('container refuse demote error is ' + err);
				}
				container.removeIp(this.ip, callback);
			}.bind(this));
}

HA.promote = function(container, callback) {
	container.promote(function(err, res) {
				if (err) {
					log.error('container refuse promote error is ' + err);
				}
				container.addIp(this.ip, Container.NETWORK.VENET, callback);
			}.bind(this));
}

HA.STATUS = {
	'UP' : 'UP',
	'DOWN' : 'DOWN',
	'ERROR' : 'ERROR'
}

exports.HA = HA;
