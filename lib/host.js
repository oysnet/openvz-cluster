var SSHHost = require('./sshHost').SSHHost,
    Container = require('./container').Container,
    htmlDecode = require('./encoder').htmlDecode,
    path = require('path');

const PVE_DATA = '/var/lib/vz/';
    
function Host(ip,options) {
  this.ip = ip;
  this.user = 'root';
  this.containers = null;
  this.maxCtid = null;
}

Host.prototype.scpTo = function(local, remote, veid, callback) {
   var h = new SSHHost(this.ip,this.user);
   h.scpTo(local,path.join(PVE_DATA,'private',String(veid),remote),callback);
}

Host.prototype.getContainers = function(callback) {
  var h = new SSHHost(this.ip,this.user);
  h.ssh('/root/vzinfo.py',function(err,res,code) {
    var containers = [],
        clazz;
    if(err) {
      callback(err);
    }
    res = JSON.parse(res);
    
    for(var i=0,l=res.length;i<l;i++) {
      data = res[i]
      var class_name = null;
      try {
        description = JSON.parse(data.description)
        class_name = description.type
      } catch(e) {
        
      }
      if(class_name != null) {
        try {
          clazz = require('./containers/'+class_name).Container;
        } catch(e) {
          clazz = Container;
        }
      } else {
         clazz = Container;
      }

      containers.push(new clazz(data,this));
    };
    this.containers = containers;
    callback(err,containers);
  }.bind(this));
}
Host.prototype.vzctl = function(options,callback) {
  var h = new SSHHost(this.ip,this.user);
  h.ssh('vzctl '+options.join(' '),function(err,res,code) {
    callback(err,res);
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
    for(var i=0,l=this.containers.length;i<l;i++) {
      if(this.containers[i].id > this.maxCtid) {
        this.maxCtid = this.containers[i].id;
      }
    }
  }
  this.maxCtid += 1;
  callback(null,this.maxCtid);
}
exports.Host = Host;