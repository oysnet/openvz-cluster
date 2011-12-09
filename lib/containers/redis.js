var util = require('util'),
    Container = require('../container').Container;
    

var Redis = function Redis() {
  Container.apply(this,Array.prototype.slice.call(arguments));
  
};
util.inherits(Redis, Container);

Redis.type = 'redis';

Redis.prototype.getSetupTasks = function() {
	return [this.installRedis.bind(this)];
}


Redis.prototype.installRedis = function(callback) {
		log.info('Install redis');
     this.exec( [
        'apt-get update',
        'wget  http://ftp.us.debian.org/debian/pool/main/r/redis/redis-server_2.2.12-1_i386.deb -O /root/redis-server_2.2.12-1_i386.deb',
        'dpkg -i /root/redis-server_2.2.12-1_i386.deb',
        'rm /root/redis-server_2.2.12-1_i386.deb',
        'echo "bind 0.0.0.0" >> /etc/redis/redis.conf',
        'echo "appendonly yes" >> /etc/redis/redis.conf',
        '/etc/init.d/redis-server restart'
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