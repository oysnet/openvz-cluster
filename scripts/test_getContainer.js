var Host = require('../lib/host').Host;

var CzAgendaApi = require('../lib/containers/czagendaapi').Container;
var CzagendaHttpProxy = require('../lib/containers/czagendahttpproxy').Container;
var Container = require('../lib/container').Container;
var async = require('async');
var ContainerTypes = require('../lib/containerTypes');
var HostManager = require('../lib/hostsManager');

ContainerTypes.register(CzAgendaApi);


var host = new Host('10.7.35.110')

setTimeout(function() {

			var ctn = host.getContainerById(128);
			ctn.addListener('changeAlive', function() {
						console.log(arguments);
					});

			ctn.addListener('changeStatus', function() {
						console.log('changeStatus', arguments);
					});

		}, 2000)
