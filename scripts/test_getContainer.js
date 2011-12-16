var Host = require('../lib/host').Host;

var CzAgendaApi = require('../lib/containers/czagendaapi').Container;
var CzagendaHttpProxy = require('../lib/containers/czagendahttpproxy').Container;
var Container = require('../lib/container').Container;
var async = require('async');
var ContainerTypes = require('../lib/containerTypes');
var Cluster = require('../lib/cluster').Cluster;

ContainerTypes.register(CzAgendaApi);

console.log('ok')
var h = new Host('10.7.35.110');



  var cluster = new Cluster();
  cluster.register(h);
  
  cluster.afterInit(function() { 
  	console.log('init')
  	var container = cluster.getContainerById(219);
		container.setRam(2048, console.log)
  	  
  	
  });



			

		
