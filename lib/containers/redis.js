var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Node = require('./node').Container,
    Container = require('../container').Container;
    

var Redis = function Redis() {
  Node.apply(this,Array.prototype.slice.call(arguments));
  this.network = Container.NETWORK.VETH;
};
util.inherits(Redis, Node);

Redis.type = 'redis';

Redis.prototype.setup = function(callback) {
  log.info('Setup new redis');
  
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


Redis.prototype.installServer = function(callback) {

     this.exec( [
        'apt-get install uuid-dev',
        'npm install -g czagenda-discovery',
        'wget  http://ftp.us.debian.org/debian/pool/main/r/redis/redis-server_2.2.12-1_i386.deb -O /root/redis-server_2.2.12-1_i386.deb',
        'dpkg -i /root/redis-server_2.2.12-1_i386.deb',
        'rm /root/redis-server_2.2.12-1_i386.deb',
        'echo "bind 0.0.0.0" >> /etc/redis/redis.conf',
        'echo "appendonly yes" >> /etc/redis/redis.conf',
        '/etc/init.d/redis-server stop'
        ].join(' && '), null, function(err,res) {
          if(err) {
            callback(err);
          }
          //this.description.type='redis';
          this.saveDescription(callback);
      }.bind(this));    
}
exports.Container = Redis