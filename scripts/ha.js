var Host = require('../lib/host').Host, Cluster = require('../lib/cluster').Cluster, Redis = require('../lib/containers/redis').Container, TestContainer = require('./testContainer').Container, HA = require('../lib/supervisors/ha').HA;
ContainerTypes = require('../lib/containerTypes'), Count = require('../lib/supervisors/count').Count;

var CzagendaHttpProxy = require('../lib/containers/czagendahttpproxy').Container;
var CzagendaApi = require('../lib/containers/czagendaapi').Container
var CzagendaElasticSearch = require('../lib/containers/czagendaelasticsearch').Container
var CzagendaRedis = require('../lib/containers/czagendaredis').Container

ContainerTypes.register(CzagendaHttpProxy);
ContainerTypes.register(CzagendaApi);
ContainerTypes.register(CzagendaElasticSearch);
ContainerTypes.register(CzagendaRedis);

var h = new Host('10.7.35.110');

var cluster = new Cluster();
cluster.register(h);

cluster.afterInit(function() {
			// HTTP PROXY
			new HA(cluster, CzagendaHttpProxy, '10.7.100.1');
			new Count(cluster, CzagendaHttpProxy, 2, false);
			
			// API
			new Count(cluster, CzagendaApi, 2);
			
			// ElasticSearch
			new HA(cluster, CzagendaElasticSearch, '10.7.100.2');
			new Count(cluster, CzagendaElasticSearch, 3)
			
			// Redis
			new HA(cluster, CzagendaRedis, '10.7.100.3');
			new Count(cluster, CzagendaRedis, 1)
		});
