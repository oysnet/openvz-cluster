var util = require('util'),
    log = require('czagenda-log').from(__filename),    
    Container = require('../container').Container, path = require('path');
    

var ElasticSearch = function ElasticSearch() {
  Container.apply(this,Array.prototype.slice.call(arguments));
  this.network = Container.NETWORK.VETH;
  this.ram = 2048;
  this.ostemplate = 'debian-6.0-standard_6.0-4_i386-elasticsearch_0.18.5';
};
util.inherits(ElasticSearch, Container);

ElasticSearch.type = 'ElasticSearch';


ElasticSearch.prototype.getSetupTasks = function() {
	return [
			
			//this.host.scpTo.bind(this.host, path.join(path.dirname(__filename), '../../ressources/elasticsearch/startup-scripts/debian'), '/etc/init.d/elasticsearch', this.id),
			//this.installServer.bind(this),
			this.setServerConfiguration.bind(this),
			this.restartServer.bind(this)
				
			];
}

ElasticSearch.prototype.installServer = function(callback) {
	log.info('Install elasctisearch');
  this.exec( [
      'apt-get update',
      'apt-get -y install openjdk-6-jre-headless curl',
      'curl -L  https://github.com/downloads/elasticsearch/elasticsearch/elasticsearch-0.18.5.tar.gz -o elasticsearch.tar.gz',
      'tar xvzf elasticsearch.tar.gz',
      'rm elasticsearch.tar.gz',
      'mv elasticsearch-* /usr/local/elasticsearch',
      'mkdir /etc/elasticsearch/',
      'chmod +x /etc/init.d/elasticsearch',
      'insserv elasticsearch'      
     
    ].join(' && '), null, function(err,res) {
      if(err) {
            log.warning('Elasctisearch install failed',err);
            callback(err);
            return;
          }
          log.info('Elasctisearch install done');
          
          callback();
      
    }.bind(this));
}

ElasticSearch.prototype.setServerConfiguration = function(callback) {
	log.info('Configure elasctisearch');
  this.exec( 
      
  	'echo -e "'+this._getServerConfiguration()+'" > /etc/elasticsearch/elasticsearch.yml'
     , null, function(err,res) {
      if(err) {
            log.warning('Elasctisearch configuration failed',err);
            callback(err);
            return;
          }
          log.info('Elasctisearch configuration done');
          
          callback();
      
    }.bind(this));
}

ElasticSearch.prototype._getServerConfiguration = function() {
	return "network:\nhost: 0.0.0.0"
}

ElasticSearch.prototype.restartServer = function(callback) {
	this.exec('/etc/init.d/elasticsearch restart', null,
			callback);
}


exports.Container = ElasticSearch