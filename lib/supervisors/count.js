var Container = require('../container').Container, log = require('czagenda-log')
		.from(__filename), async = require('async');

function Count(cluster, clazz, number, ignoreSurplus) {

	this.__checkTimer = null;
	this.__checking = false;
	this.__bindedCheckCount = this.__checkCount.bind(this);
	this.containers = {};
	this.__failedCreateOnHosts = [];
	this.cluster = cluster;
	
	this.__ignoreSurplus = ignoreSurplus === true;
	
	this.cluster.on('addContainer', this.__addContainer.bind(this));
	this.cluster.on('removeContainer', this.__removeContainer.bind(this));

	this.number = number;
	this.clazz = clazz;

	var containers = cluster.getContainersByType(clazz);
	for (var i = 0, l = containers.length; i < l; i++) {
		this.__addContainer(containers[i]);
	}
	
	this.__checkCount();
	
}

Count.prototype.getHostsSortByCtnCount = function() {

	var hosts = {};

	for (var i = 0, l = this.cluster.hosts.length; i < l; i++) {

		var nb = 0;
		for (var j = 0, k = this.cluster.hosts[i].containers.length; j < k; j++) {
			if (this.cluster.hosts[i].containers[j].vmStatus === Container.STATUS.RUNNING) {
				nb++;
			}
		}

		hosts[this.cluster.hosts[i].ip] = {
			host : this.cluster.hosts[i],
			nb : nb
		}
	}

	var _sort = [];
	for (var hostIp in hosts) {
		_sort.push(hosts[hostIp])
	}
	_sort.sort(function(a, b) {
				var x = a.nb;
				var y = b.nb;
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			})
	var res = [];
	for (var i = 0, l = _sort.length; i < l; i++) {
		res.push(_sort[i].host);
	}

	return res;
}

Count.prototype.__addContainer = function(container) {
	if (container.constructor.type != this.clazz.type) {
		return;
	}
	
	container.on('changeVmStatus', this.__bindedCheckCount);
	this.containers[container.id] = container;
	this.__checkCount();
}

Count.prototype.__removeContainer = function(container) {
	if (container.constructor.type !== this.clazz.type) {
		return;
	}

	container.removeListener('changeVmStatus', this.__bindedCheckCount);
	delete this.containers[container.id];
	this.__checkCount();
}

Count.prototype.__checkCount = function() {

	if (this.__checkTimer !== null) {
		clearTimeout(this.__checkTimer);
	}
	this.__checkTimer = setTimeout(this.__doCheckCount.bind(this), 500);

}

Count.prototype.__doCheckCount = function() {

	if (this.__checking === true) {
		this.__checkCount();
		return;
	}
	this.__checking = true;

	var runnings = [];
	var spares = [];
	var installings = [];
	
	for (var ctid in this.containers) {

		var c = this.containers[ctid];

		if (c.vmStatus === null) {
			this.__checking = false;
			this.__checkCount();
			return;
		}

		switch (c.vmStatus) {

			case Container.VMSTATUS.RUNNING :
				runnings.push(c);
				break;

			case Container.VMSTATUS.STOPPED :
			case Container.VMSTATUS.SUSPENDED :
				spares.push(c);
				break
				
			case Container.VMSTATUS.INSTALLING:
				installings.push(c);
		}
	}

	if (runnings.length > this.number && this.__ignoreSurplus === false) {

		log.info('COUNT ( '+this.clazz.type+' ) : Need stop ' + (runnings.length - this.number) + ' container(s)')

		var asyncMethods = [];

		for (var i = 0, l = runnings.length - this.number; i < l; i++) {
			var container = runnings.shift();

			asyncMethods.push(function(container, callback) {
						log
								.notice('COUNT ( '+this.clazz.type+' ) : stop running container '
										+ container.id);

						container.stop(function(err, res) {
									// todo: what if a container fail to start
									if (err !== null) {
										log.error('COUNT ( '+this.clazz.type+' ) : Container fail to stop '
												+ container.id)
									}

									log.notice('COUNT ( '+this.clazz.type+' ) : Container stopped '
											+ container.id)

									callback();
								}.bind(this));
					}.bind(this, container));

		}

		async.parallel(asyncMethods, function() {
					this.__checking = false;
					this.__checkCount();
				}.bind(this));

	} else if (runnings.length < this.number) {
		
		log.info('COUNT ( '+this.clazz.type+' ) : Need start ' + (this.number - runnings.length)+ ' container(s)')
			
		
		if (installings.length > 0) {
			log.info('COUNT ( '+this.clazz.type+' ) : Wait for installing vm to finish');
			this.__checking = false;
			return;
		}
				
		var asyncMethods = [];

		for (var i = 0, l = this.number - runnings.length; i < l; i++) {

			// start a spare
			if (spares.length > 0) {
				var spare = spares.shift();
				asyncMethods.push(function(container, callback) {
							log.notice('COUNT ( '+this.clazz.type+' ) : start spare container '
									+ container.id);
							container.start(function(err, res) {
										// todo: what if a container fail to
										// start
										if (err !== null) {
											log
													.error('COUNT ( '+this.clazz.type+' ) : Spare container fail to start '
															+ container.id)
										}

										log.notice('COUNT ( '+this.clazz.type+' ) : Spare container started '
												+ container.id)

										callback();

									}.bind(this));
						}.bind(this, spare));
			} else {

				asyncMethods.push(function(callback) {

							var host = null;

							var availlableHosts = this.getHostsSortByCtnCount();
							availlableHosts.reverse();
							
							for (var i = 0, l = availlableHosts.length; i < l; i++) {
								if (this.__failedCreateOnHosts
										.indexOf(availlableHosts[i]) === -1) {
									host = availlableHosts[i];
									break;
								}
							}
							
							if (host === null) {
								log.warning('COUNT ( '+this.clazz.type+' ) : No host availlable to create new container');
								callback();
								return;
							}
							
							var container = new this.clazz({}, host);
							container.setup(function(err) {

										if (err) {
											this.__failedCreateOnHosts
													.push(host);
											log
													.error('COUNT ( '+this.clazz.type+' ) : Container fail to setup '
															+ container.id)
										}
										log
												.notice('COUNT ( '+this.clazz.type+' ) : Container setted up and started '
														+ container.id)
										callback();
									}.bind(this));
						}.bind(this));
			}

		}

		async.series(asyncMethods, function() {
					this.__checking = false;
					this.__checkCount();
				}.bind(this));

	} else {
		log.info('COUNT ( '+this.clazz.type+' ) : All done')
		this.__checking = false;
	}

}
exports.Count = Count;