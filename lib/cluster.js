var errors = require('./errors'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;
    
function Cluster() {
  this.hosts = [];
}

util.inherits(Cluster, EventEmitter);

Cluster.prototype.register = function(host) {
  this.hosts.push(host);
  host.on('addContainer', function(container) {
        this.emit('addContainer', container);
    }.bind(this));
  host.on('removeContainer', function(container) {
        this.emit('removeContainer', container);
    }.bind(this));
  
}


Cluster.prototype.getContainerById = function(id) {
  var res = null;
  for(var i=0,l=this.hosts.length;i<l;i++) {
    res = this.hosts[i].getContainerById(id);
    if(res !== null) {
      return res;
    }
  }
}
Cluster.prototype.getContainersByType = function(clazz) {
  var res = null;
  for(var i=0,l=this.hosts.length;i<l;i++) {
    res = this.hosts[i].getContainersByType(clazz);
    if(res !== null) {
      return res;
    }
  }
}

exports.Cluster = Cluster;
