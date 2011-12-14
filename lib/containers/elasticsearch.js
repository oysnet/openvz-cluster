var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Node = require('./node').Container,
    Container = require('../container').Container;
    

var ElasticSearch = function ElasticSearch() {
  Node.apply(this,Array.prototype.slice.call(arguments));
  this.network = Container.NETWORK.VETH;
};
util.inherits(ElasticSearch, Node);

ElasticSearch.type = 'ElasticSearch';


ElasticSearch.prototype.getSetupTasks = function() {
	return [
			this.installServer.bind(this), this.startServer.bind(this)];
}

ElasticSearch.prototype.installServer = function(callback) {
	log.info('Install elasctisearch');
  this.exec( [
      'apt-get install uuid-dev',
      'mkdir -p /home/czagenda-http-proxy',
      'cd /home/czagenda-http-proxy',
      'git clone git://git.oxys.net/czagenda-http-proxy.git .',
      "echo \"exports.IP = '"+this.ip+"';\" > config.js",
      "echo \"exports.PORT = 3000;\" >> config.js",
      'mkdir pids',
      'mkdir logs',
      'npm update'
    ].join(' && '), null, function(err,res) {
      if(err) {
            log.warning('Elasctisearch install failed',err);
            callback(err);
            return;
          }
          log.info('Elasctisearch install done');
          
          callback();
      
    }.bind(this));
}

ElasticSearch.prototype.startServer = function (callback) {
	this.exec('cd /home/czagenda-http-proxy;node server.js start 2>&1 >> /tmp/log', null, callback)
}

exports.Container = ElasticSearch