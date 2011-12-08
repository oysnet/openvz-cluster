function Count(cluster, clazz, number) {

	this.__checkTimer = null;
	this.__checking = false;
	this.__bindedCheckCount = this.__checkCount.bind(this);
	this.containers = {};
	
	this.cluster = cluster;

	this.cluster.on('addContainer', this.__addContainer.bind(this));
	this.cluster.on('removeContainer', this.__removeContainer.bind(this));

	this.number = number;
	this.clazz = clazz;
	
	this.__checkCount();
	
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
	
	for (var ctid in this.containers) {
		
		var c = this.containers[ctid];
		console.log(c.vmStatus);
		if (c.vmStatus === null) {
      this.__checking = false;
      this.__checkCount();
      return;
    }
	}
	
	this.__checking = false;

}
exports.Count = Count;