var util = require('util'), log = require('czagenda-log').from(__filename), Node = require('./node').Container, Container = require('../container').Container;

var CzagendaHttpProxy = function CzagendaHttpProxy() {
	Node.apply(this, Array.prototype.slice.call(arguments));
	this.network = Container.NETWORK.VETH;
};
util.inherits(CzagendaHttpProxy, Node);

CzagendaHttpProxy.type = 'CzagendaHttpProxy';

CzagendaHttpProxy.prototype.getSetupTasks = function() {
	return Node.prototype.getSetupTasks.call(this).concat([
			this.installServer.bind(this), this.restartServer.bind(this)]);
}

CzagendaHttpProxy.prototype.installServer = function(callback) {
	log.info('Install czagenda-http-proxy');
	this.exec([
					'apt-get install uuid-dev',
					'mkdir -p /home/czagenda-http-proxy',
					'cd /home/czagenda-http-proxy',
					'git clone git://git.oxys.net/czagenda-http-proxy.git .',
					'cat settings.sample.js|sed "s/%IP%/' + this.getIp()
							+ '/g" > settings.js', 'mkdir pids', 'mkdir logs',
					'npm update', 'chmod +x /home/czagenda-http-proxy/startup_scripts/debian', 'ln -s /home/czagenda-http-proxy/startup_scripts/debian /etc/init.d/czagenda-http-proxy'].join(' && '), null, function(err, res) {
				if (err) {
					log.warning('czagenda-http-proxy install failed', err);
					callback(err);
					return;
				}
				log.info('czagenda-http-proxy install done');

				callback();

			}.bind(this));
}

CzagendaHttpProxy.prototype.restartServer = function(callback) {
	this.exec(['/etc/init.d/czagenda-http-proxy restart'].join(' && '), null,
			callback);
}

CzagendaHttpProxy.prototype.updateServer = function(callback) {
	this.exec([
					'cd /home/czagenda-http-proxy',
					'git pull',
					'cat settings.sample.js|sed "s/%IP%/' + this.getIp()
							+ '/g" > settings.js', 'npm update'].join(' && '),
			null, function(err, res) {
				if (err) {
					callback(err);
					return;
				}
				this.restartServer(callback);
			}.bind(this));
}
exports.Container = CzagendaHttpProxy