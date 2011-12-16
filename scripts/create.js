var Host = require('../lib/host').Host, Cluster = require('../lib/cluster').Cluster, Redis = require('../lib/containers/redis').Container, TestContainer = require('./testContainer').Container, HA = require('../lib/supervisors/ha').HA;
ContainerTypes = require('../lib/containerTypes'), Count = require('../lib/supervisors/count').Count, Node = require('../lib/containers/node').Container;

var CzagendaApi = require('../lib/containers/czagendaapi').Container

var CzagendaElasticSearch = require('../lib/containers/czagendaelasticsearch').Container
var CzagendaRedis = require('../lib/containers/czagendaredis').Container
ContainerTypes.register(CzagendaRedis);

var h = new Host('10.7.35.110');

var cluster = new Cluster()
cluster.register(h);
cluster.afterInit(function() {

			var ctn = new CzagendaRedis({}, h);
			ctn.setup(function(err) {
						console.log(err)
					});

		})