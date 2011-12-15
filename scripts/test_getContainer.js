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
  	var container = cluster.getContainerById(217);
		
  	container.on('changeStatus',function (status) {
  		console.log('changeStatus', status)
  	})
  	
  	container.on('changeVmStatus',function (status) {
  		console.log('changeVmStatus', status)
  	})
  	
  	console.log('Container 217', container.status, container.vmStatus)
  	
  	setTimeout(function () {
  		console.log('set vmStatus 5')
  		container.refreshInfo({vmStatus : 5});
  		
  		setTimeout(function () {
  		console.log('set vmStatus 1')
  		container.refreshInfo({vmStatus : 1});
  	}, 5000)
  		
  	}, 5000)
  	
  });



			

		
