var log = require('czagenda-log').from(__filename), exec = require('child_process').exec, util = require("util"), EventEmitter = require('events').EventEmitter;

function IpMonitor(ip, frequency) {
	this.ip = ip;
	this.__frequency = typeof(frequency) !== 'undefined' ? frequency : 500;
	this.__intervalId = null;
	this.status = null;
  this.__ping = false;
}

util.inherits(IpMonitor, EventEmitter);

IpMonitor.prototype.start = function() {
	if (this.__intervalId === null) {
		this.__intervalId = setInterval(this._monitor.bind(this),
				this.__frequency);
	}
}

IpMonitor.prototype.stop = function() {
	if (this.__intervalId !== null) {
		clearInterval(this.__intervalId);
	}
}

IpMonitor.prototype._monitor = function() {
  if(this.__ping) {
    return;
  }
  this.__ping = true;
  exec("ping -W 200 -c 1 " + this.ip, function puts(error, stdout, stderr) {
				if (error && (this.status === IpMonitor.STATUS.UP || this.status === null)) {
					this.status = IpMonitor.STATUS.DOWN;
          this.emit('changeStatus', IpMonitor.STATUS.DOWN);
				} else if (!error && (this.status === IpMonitor.STATUS.DOWN || this.status === null)) {
					this.status = IpMonitor.STATUS.UP;
					this.emit('changeStatus', IpMonitor.STATUS.UP);
				}
        this.__ping = false;
			}.bind(this));
}

IpMonitor.STATUS= {
  'UP' : 'UP',
  'DOWN' : 'DOWN'
}

exports.IpMonitor = IpMonitor