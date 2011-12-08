var Host = require('../lib/host').Host,
    Cluster = require('../lib/cluster').Cluster,
    Redis =  require('../lib/containers/redis').Container,
    HA = require('../lib/supervisors/ha').HA;
    ContainerTypes = require('../lib/containerTypes'),
    Count = require('../lib/supervisors/count').Count;
    
ContainerTypes.register(Redis);

var h = new Host('10.7.35.110');
var cluster = new Cluster()
cluster.register(h);

cluster.afterInit(function() {
  //new HA(cluster,Redis,'10.7.35.177');
  new Count(cluster,Redis,3);
  
});
 