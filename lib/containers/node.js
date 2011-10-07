var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Container = require('../container').Container;
    

var Node = function Node() {
  Container.apply(this,Array.prototype.slice.call(arguments));
  
};
util.inherits(Node, Container);

Node.prototype.setup = function(callback) {
  log.info('Setup new node');
  Container.prototype.setup.apply(this,[function(err,res) {
      if(err) {
        callback(err);
        return;
      }
      this.installNode(callback);
  }.bind(this)]);
}

Node.prototype.installNode = function(callback) {
     log.info('Install node');
     this.exec( [
        'apt-get update',
        'apt-get -y install build-essential',
        'apt-get -y install git libssl-dev curl',
        'cd /root/',
        'wget http://nodejs.org/dist/node-v0.4.12.tar.gz',
        'tar -zxf node-v0.4.12.tar.gz',
        'cd node-v0.4.12',
        './configure',
        'make',
        'make install',
        'cd /root/',
        'rm -Rf node-*',
        'curl http://npmjs.org/install.sh | clean=no sh',
        ].join(' && '), function(err,res) {
          if(err) {
            log.warning('Node install failed',err);
            callback(err);
            return;
          }
          log.info('Node install done');
          this.description.type='node';
          this.saveDescription(callback);
      }.bind(this));    
}
exports.Container = Node