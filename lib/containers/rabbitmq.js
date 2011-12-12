var util = require('util'),
    Container = require('../container').Container;
    

var RabbitMQ = function RabbitMQ() {
  Container.apply(this,Array.prototype.slice.call(arguments));
  
};
util.inherits(RabbitMQ, Container);

RabbitMQ.type = 'RabbitMQ';

RabbitMQ.prototype.setup = function(callback) {
  console.log('Setup RabbitMQ …');
  Container.prototype.setup.apply(this,[function(err,res) {
      if(err) {
        console.log ('creation error', err);
        return;
      }
      this.installServer(callback);
  }.bind(this)]);
}



RabbitMQ.prototype.installServer = function(callback) {

     this.exec( [
        'apt-get update',
        'apt-get install -y rabbitmq-server'
        ].join(' && '), null,function(err,res) {
          if(err) {
            callback(err);
          }
          this.saveDescription(callback);
      }.bind(this));    
}


RabbitMQ.prototype.addAccount = function (name, password, callback) {
  /*
   rabbitmqctl add_user name password
   rabbitmqctl add_vhost name
   rabbitmqctl set_permissions -p name name ".*" ".*" ".*"  
  */
  /*this.exec([
    'cd /root/RabbitMQ-admin/',
    'git pull',
    'echo " " >> conf/RabbitMQ.conf',
    'echo "@'+name+' = " >> conf/RabbitMQ.conf',
    'echo "repo '+name+'" >> conf/RabbitMQ.conf',
    'echo "     RW+ = admin @admins @'+name+'" >> conf/RabbitMQ.conf',
    'git commit -am "add repositoriy '+ name +'"',
    'git push origin master'
  ].join(' && '), null,callback);*/
}

exports.Container = RabbitMQ