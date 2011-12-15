var util = require('util'), log = require('czagenda-log').from(__filename), Container = require('../lib/container').Container;

var TestContainer = function TestContainer() {
	Container.apply(this, Array.prototype.slice.call(arguments));
	this.network = Container.NETWORK.VETH;
};
util.inherits(TestContainer, Container);

TestContainer.prototype.getSetupTasks = function() {
	return [function(callback) {
				log.info('Install TestContainer');
				this.exec(['sleep 20'].join(' && '), null, function(err, res) {
							if (err) {
								log
										.warning(
												'TestContainer install failed',
												err);
								callback(err);
								return;
							}
							log.info('TestContainer install done');

							callback();

						}.bind(this));
			}.bind(this)];
}

TestContainer.prototype.setup = function(callback) {
	log.info('Setup new TestContainer');
	Container.prototype.setup.apply(this, [function(err, res) {
						if (err) {
							callback(err);
							return;
						}
						this.saveDescription(callback);
					}.bind(this)]);
}

TestContainer.type = 'TestContainer';

exports.Container = TestContainer