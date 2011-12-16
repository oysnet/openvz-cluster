var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Container = require('../container').Container;
    

var Node = function Node() {
  Container.apply(this,Array.prototype.slice.call(arguments));
  this.ostemplate = 'debian-6.0-standard_6.0-4_i386-node'
};
util.inherits(Node, Container);

Node.type = 'node';


Node.prototype.installNode = function(callback) {
		
		// theses stuff are included in template
	
     log.info('Install node');
     this.exec( [
        'apt-get update',
        'apt-get -y install build-essential',
        'apt-get -y install git libssl-dev curl',
        'apt-get install uuid-dev',
        'cd /root/',
        'wget http://nodejs.org/dist/node-v0.4.12.tar.gz',
        'tar -zxf node-v0.4.12.tar.gz',
        'cd node-v0.4.12',
        './configure',
        'make',
        'make install',
        'cd /root/',
        'rm -Rf node-*',
        'curl http://npmjs.org/install.sh | clean=no sh'
        ].join(' && '), null,function(err,res) {
          if(err) {
            log.warning('Node install failed',err);
            callback(err);
            return;
          }
          log.info('Node install done');
          
          callback();
          
      }.bind(this));    
}
exports.Container = Node