var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Node = require('./node').Container,
    Container = require('../container').Container;
    

var CzagendaApi = function CzagendaApi() {
  Node.apply(this,Array.prototype.slice.call(arguments));
  this.network = Container.NETWORK.VETH;
};
util.inherits(CzagendaApi, Node);

CzagendaApi.type = 'czagendaapi';

CzagendaApi.prototype.getSetupTasks = function () {
	return Node.prototype.getSetupTasks.call(this).concat([this.installServer.bind(this), this.restartServer.bind(this)]);
}

CzagendaApi.prototype.installServer = function(callback) {
	
	log.info('Install czagenda-api');
	
  this.exec( [
      'mkdir -p /home/czagenda-api',
      'cd /home/czagenda-api',
      'git clone git://git.oxys.net/czagenda-api.git .',
      'cat settings.sample.js|sed "s/%IP%/'+this.getIp()+'/g" > settings.js',
    	'mkdir pids',
      'mkdir logs',
      'npm update',
      'chmod +x /home/czagenda-api/startup_scripts/startup-debian', 
					'ln -s /home/czagenda-api/startup_scripts/startup-debian /etc/init.d/czagenda-api', 
					'insserv czagenda-api'
    ].join(' && '), null, function(err,res) {
      if(err) {
            log.warning('czagenda-api install failed',err);
            callback(err);
            return;
          }
          log.info('czagenda-api install done');
          
          callback();
    }.bind(this));
}


CzagendaApi.prototype.restartServer= function(callback) {
  this.exec( [
    '/etc/init.d/czagenda-api restart'
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