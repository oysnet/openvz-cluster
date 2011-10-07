var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Node = require('./node').Container;
    

var CzagendaHttpProxy = function CzagendaHttpProxy() {
  Node.apply(this,Array.prototype.slice.call(arguments));
  this.network = 'veth';
};
util.inherits(CzagendaHttpProxy, Node);

CzagendaHttpProxy.prototype.setup = function(callback) {
  log.info('Setup new czagenda-http-proxy');
  Node.prototype.setup.apply(this,[function(err,res) {
      if(err) {
        callback(err);
        return;
      }
      this.installServer(function(err,res) {
        this.description.type='CzagendaHttpProxy';
        this.saveDescription(callback);
      }.bind(this));
  }.bind(this)]);
}

CzagendaHttpProxy.prototype.installServer = function(callback) {
  this.exec( [
      'apt-get install uuid-dev',
      'mkdir -p /home/czagenda-http-proxy',
      'cd /home/czagenda-http-proxy',
      'git clone git://git.oxys.net/czagenda-http-proxy.git .',
      'cat settings.sample.js|sed "s/%IP%/'+this.getIp()+'/g" > settings.js',
    	'mkdir pids',
      'mkdir logs',
      'npm update'
    ].join(' && '), function(err,res) {
      if(err) {
        callback(err);
        return;
      }
      this.restartServer(callback);
    }.bind(this));
}


CzagendaHttpProxy.prototype.restartServer= function(callback) {
  this.exec( [
    'cd /home/czagenda-http-proxy',
    './restart'
  ].join(' && '), callback);
}

CzagendaHttpProxy.prototype.updateServer = function(callback) {
  this.exec( [
    'cd /home/czagenda-http-proxy',
    'git pull',
    'cat settings.sample.js|sed "s/%IP%/'+this.getIp()+'/g" > settings.js',
    'npm update'
  ].join(' && '), function(err,res) {
    if(err) {
      callback(err);
      return;
    }
    this.restartServer(callback);
  }.bind(this));
}
exports.Container = CzagendaHttpProxy