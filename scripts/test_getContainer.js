var Host = require('../lib/host').Host;

var CzAgendaApi = require('../lib/containers/czagendaapi').Container;
var CzagendaHttpProxy = require('../lib/containers/czagendahttpproxy').Container;
var Container = require('../lib/container').Container;
var async = require('async');
var ContainerTypes = require('../lib/containerTypes');
var Cluster = require('../lib/cluster').Cluster;

ContainerTypes.register(CzagendaHttpProxy);


var h = new Host('10.7.35.110');



  var cluster = new Cluster();
  cluster.register(h);
  
  cluster.afterInit(function() { 
  	var containers = cluster.getContainersByType(CzagendaHttpProxy);
		console.log(containers[0].id)
  
  });



			

		
