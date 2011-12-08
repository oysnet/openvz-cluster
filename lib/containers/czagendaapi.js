var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Node = require('./node').Container;
    

var CzagendaApi = function CzagendaApi() {
  Node.apply(this,Array.prototype.slice.call(arguments));
  this.network = Container.NETWORK.VETH;
};
util.inherits(CzagendaApi, Node);

CzagendaApi.type = 'czagendaapi';

CzagendaApi.prototype.setup = function(callback) {
  log.info('Setup new czagenda-api');
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

CzagendaApi.prototype.installServer = function(callback) {
  this.exec( [
      'apt-get install uuid-dev',
      'mkdir -p /home/czagenda-api',
      'cd /home/czagenda-api',
      'git clone git://git.oxys.net/czagenda-api.git .',
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


CzagendaApi.prototype.restartServer= function(callback) {
  this.exec( [
    'cd /home/czagenda-api',
    './restart'
  ].join(' && '), null, callback);
}

CzagendaApi.prototype.updateServer = function(callback) {
  this.exec( [
    'cd /home/czagenda-api',
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
exports.Container = CzagendaApi