var util = require('util'),
    Container = require('../container').Container;
    

var Django = function Django() {
  Container.apply(this,Array.prototype.slice.call(arguments));
  
};
util.inherits(Django, Container);

Django.type = 'Django';

Django.prototype.setup = function(callback) {
  console.log('Setup Django …');
  Container.prototype.setup.apply(this,[function(err,res) {
      if(err) {
        console.log ('creation error', err);
        return;
      }
      this.installDjango(callback);
  }.bind(this)]);
}



Django.prototype.installDjango = function(callback) {

     this.exec( [
        'apt-get update',
        'apt-get -y install git python-virtualenv libmysqlclient-dev build-essential python-dev mercurial subversion',
        'pip install virtualenvwrapper',
        'useradd -m -s /bin/bash virtualenv',    
        'echo "source /usr/local/bin/virtualenvwrapper.sh" >> /home/virtualenv/.bashrc', 
        'su - virtualenv -c "source /usr/local/bin/virtualenvwrapper.sh"',
        'su - virtualenv -c "cd ~/; ssh-keygen -q -N \'\' -t dsa -f /home/virtualenv/.ssh/id_dsa"',
        
        ].join(' && '), null,function(err,res) {
          if(err) {
            callback(err);
          }
          this.saveDescription(callback);
      }.bind(this));    
}


Django.prototype.getPublicKey = function (callback) {
	this.exec( [
        'cat /home/virtualenv/.ssh/id_dsa.pub'
        ].join(' && '), null,callback);    
}

Django.prototype.createProject = function (name, gitServer, repos, callback) {
	this.exec( [
        
        'su - virtualenv -c "source /usr/local/bin/virtualenvwrapper.sh && mkvirtualenv --clear --no-site-packages ' +name+ '"',
        'su - virtualenv -c "ssh -o \'StrictHostKeyChecking no\' git@'+gitServer+'"',       
        'su - virtualenv -c "cd /home/virtualenv/.virtualenvs/'+ name +' && git clone git@'+gitServer+':'+repos+' && ln -s '+repos+' repos"'
        ].join(' && '), null,callback);    
}

exports.Container = Django