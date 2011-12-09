var Host = require('../lib/host').Host, Cluster = require('../lib/cluster').Cluster, Redis = require('../lib/containers/redis').Container, TestContainer = require('./testContainer').Container, HA = require('../lib/supervisors/ha').HA;
ContainerTypes = require('../lib/containerTypes'), Count = require('../lib/supervisors/count').Count;

ContainerTypes.register(TestContainer);

var h = new Host('10.7.35.110');

var cluster = new Cluster()
cluster.register(h);
cluster.afterInit(function() {
			var container = new TestContainer({}, h);
			
			container.setup(function() {
						console.log(arguments)
					})
		})