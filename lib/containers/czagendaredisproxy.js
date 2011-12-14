var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Node = require('./node').Container;
    

var CzagendaRedisProxy = function CzagendaRedisProxy() {
  Node.apply(this,Array.prototype.slice.call(arguments));
  this.network = Container.NETWORK.VETH;
};
util.inherits(CzagendaRedisProxy, Node);

CzagendaRedisProxy.type = 'CzagendaRedisProxy';

CzagendaRedisProxy.prototype.setup = function(callback) {
  log.info('Setup new czagenda-redis-proxy');
  Node.prototype.setup.apply(this,[function(err,res) {
      if(err) {
        callback(err);
        return;
      }
      this.installServer(function(err,res) {
        this.saveDescription(callback);
      }.bind(this));
  }.bind(this)]);
}

CzagendaRedisProxy.prototype.installServer = function(callback) {
  this.exec( [
      'apt-get install uuid-dev',
      'mkdir -p /home/czagenda-redis-proxy',
      'cd /home/czagenda-redis-proxy',
      'git clone git://git.oxys.net/czagenda-redis-proxy.git .',
      'cat settings.sample.js|sed "s/%IP%/'+this.getIp()+'/g" > settings.js',
      'mkdir pids',
      'mkdir logs',
      'npm update'
    ].join(' && '), null, function(err,res) {
      if(err) {
        callback(err);
        return;
      }
      this.restartServer(callback);
    }.bind(this));
}


CzagendaRedisProxy.prototype.restartServer= function(callback) {
  this.exec( [
    'cd /home/czagenda-redis-proxy',
    './restart'
  ].join(' && '), null, callback);
}

CzagendaRedisProxy.prototype.updateServer = function(callback) {
  this.exec( [
    'cd /home/czagenda-redis-proxy',
    'git pull',
    'cat settings.sample.js|sed "s/%IP%/'+this.getIp()+'/g" > settings.js',
    'npm update'
  ].join(' && '), null, function(err,res) {
    if(err) {
      callback(err);
      return;
    }
    this.restartServer(callback);
  }.bind(this));
}
exports.Container = CzagendaRedisProxy