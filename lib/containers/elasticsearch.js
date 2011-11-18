var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Node = require('./node').Container;
    

var ElasticSearch = function ElasticSearch() {
  Node.apply(this,Array.prototype.slice.call(arguments));
  this.network = 'veth';
};
util.inherits(ElasticSearch, Node);

ElasticSearch.type = 'ElasticSearch';

ElasticSearch.prototype.setup = function(callback) {
  log.info('Setup new ElasticSearch');
  Node.prototype.setup.apply(this,[function(err,res) {
      if(err) {
        callback(err);
        return;
      }
      this.installServer(function(err,res) {
        //this.description.type='ElasticSearch';
        this.saveDescription(callback);
      }.bind(this));
  }.bind(this)]);
}

ElasticSearch.prototype.installServer = function(callback) {
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
        callback(err);
        return;
      }
      this.exec('cd /home/czagenda-http-proxy;node server.js start 2>&1 >> /tmp/log', null, callback)
    }.bind(this));
}


ElasticSearch.prototype.restartServer= function(callback) {
  this.exec( [
    'cd /home/czagenda-http-proxy',
    './restart'
  ].join(' && '), null, callback);
}

ElasticSearch.prototype.updateServer = function(callback) {
  this.exec( [
    'cd /home/czagenda-http-proxy',
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
exports.Container = ElasticSearch