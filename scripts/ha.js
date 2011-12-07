var Host = require('../lib/host').Host;

var CzAgendaApi = require('../lib/containers/czagendaapi').Container;
var CzagendaHttpProxy = require('../lib/containers/czagendahttpproxy').Container;
var Container = require('../lib/container').Container;

var ContainerTypes = require('../lib/containerTypes');
var HostManager = require('../lib/hostsManager');
var HASupervisor = require('../lib/haSupervisor');

ContainerTypes.register(CzAgendaApi);

var hm = new HostManager(new Host('10.7.35.110'));
hm.register(new Host('10.7.35.110'), function() {

			var has = new HASupervisor(hm, {
						type : CzAgendaApi.type,
						masterIP : '10.7.51.2'
					});
		
			has.start(function () {
				console.log(arguments)
			})	
				
		});
