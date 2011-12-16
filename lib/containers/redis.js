var util = require('util'),
    log = require('czagenda-log').from(__filename),
    Node = require('./node').Container,
    Container = require('../container').Container;
    

var Redis = function Redis() {
  Node.apply(this,Array.prototype.slice.call(arguments));
  this.ostemplate = "debian-6.0-standard_6.0-4_i386-node_0.4.12-redis_2.2.12"
};
util.inherits(Redis, Node);

Redis.type = 'redis';

/*
Redis.prototype.getSetupTasks = function() {
	return [this.installRedis.bind(this)];
}
*/
Redis.prototype.installRedis = function(callback) {
		log.info('Install redis');
     this.exec( [
        'npm install -g czagenda-discovery',
        'wget  http://ftp.us.debian.org/debian/pool/main/r/redis/redis-server_2.2.12-1_i386.deb -O /root/redis-server_2.2.12-1_i386.deb',
        'dpkg -i /root/redis-server_2.2.12-1_i386.deb',
        'rm /root/redis-server_2.2.12-1_i386.deb',
        'echo "bind 0.0.0.0" >> /etc/redis/redis.conf',
        'echo "appendonly yes" >> /etc/redis/redis.conf',
        '/etc/init.d/redis-server stop'
        ].join(' && '), null, function(err,res) {
         if (err) {
							log.warning('Redis install failed', err);
							callback(err);
							return;
						}
						log.info('Redis install done');

						callback();
      }.bind(this));    
}
exports.Container = Redis