var util = require('util'),
    Container = require('../container').Container;
    

var Redis = function Redis() {
  Container.apply(this,Array.prototype.slice.call(arguments));
  
};
util.inherits(Redis, Container);

redis.type = 'redis';

Redis.prototype.setup = function(callback) {
  console.log('Setup redis …');
  Container.prototype.setup.apply(this,[function(err,res) {
      if(err) {
        console.log ('creation error', err);
        return;
      }
      this.installRedis(callback);
  }.bind(this)]);
}


Redis.prototype.installRedis = function(callback) {

     this.exec( [
        'apt-get update',
        'wget  http://ftp.us.debian.org/debian/pool/main/r/redis/redis-server_2.2.12-1_i386.deb -O /root/redis-server_2.2.12-1_i386.deb',
        'dpkg -i /root/redis-server_2.2.12-1_i386.deb',
        'rm /root/redis-server_2.2.12-1_i386.deb',
        'echo "bind 0.0.0.0" >> /etc/redis/redis.conf',
        'echo "appendonly yes" >> /etc/redis/redis.conf',
        '/etc/init.d/redis-server restart'
        ].join(' && '), null, function(err,res) {
          if(err) {
            callback(err);
          }
          //this.description.type='redis';
          this.saveDescription(callback);
      }.bind(this));    
}
exports.Container = Redis