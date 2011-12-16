var async = require('async');

var Host = require('../lib/host').Host;
var Cluster = require('../lib/cluster').Cluster;
var ContainerTypes = require('../lib/containerTypes');

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

			var methods = [];
			
			// Redis
			methods.push(function(callback) {
						var ctn = new CzagendaRedis({}, h);
						ctn.setup(function () {
							ctn.addIp( '10.7.100.3',false ,callback)
						});
					})
					
			// ES 1
			methods.push(function(callback) {
						var ctn = new CzagendaElasticSearch({}, h);
						ctn.setup(function () {
							ctn.addIp( '10.7.100.2',false ,callback)
						});
					})
					
			// ES 2
			methods.push(function(callback) {
						var ctn = new CzagendaElasticSearch({}, h);
						ctn.setup(callback);
					})
					
			// API 1
			methods.push(function(callback) {
						var ctn = new CzagendaApi({}, h);
						ctn.setup(callback);
					})
					
			// API 2					
			methods.push(function(callback) {
						var ctn = new CzagendaApi({}, h);
						ctn.setup(callback);
					})
					
			// API PROXY 1					
			methods.push(function(callback) {
						var ctn = new CzagendaHttpProxy({}, h);
						ctn.setup(callback);
					})
					
			// API PROXY 2				
			methods.push(function(callback) {
						var ctn = new CzagendaHttpProxy({}, h);
						ctn.setup(callback);
					})
			
			async.series(methods, function () {
				console.log(arguments)
			})
					
		});
