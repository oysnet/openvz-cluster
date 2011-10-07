var spawn = require('child_process').spawn,
    log = require('czagenda-log').from(__filename);

function SSHHost(ip,user,options) {
  this.ip = ip;
  this.user = user;
} 


SSHHost.prototype.scpTo = function(local, remote,callback) {
  var ssh, 
      stderr = '',
      stdout = '';
  ssh = spawn('scp', ['-r', local,this.user+'@'+this.ip+':'+remote]);
  
  ssh.on('exit', function (code, signal) {
    var err = stderr.replace(/^\s|\s$/g, '');
    if (err === '' && code === 0) {
      err = null;
    }
    callback(err, stdout.replace(/^\s|\s$/g, ''),code);
  });
  
  ssh.stdout.on('data', function (out) {
   stdout+=out.toString();
  });
  ssh.stderr.on('data', function (out) {
   stderr+=out.toString();
  });
}
SSHHost.prototype.ssh = function(command,callback) {
  var ssh, 
      stderr = '',
      stdout = '';

  ssh = spawn('ssh', [this.user+'@'+this.ip, command]);
  
  ssh.on('exit', function (code, signal) {
    var err = stderr.replace(/^\s|\s$/g, '');
    var res = stdout.replace(/^\s|\s$/g, '');
    if (code === 0) {
      res+='\n'+err;
      err = null;
    } else {
      
    }
    callback(err,res, code);
  });
  
  var logPrefix = command+' ['+this.ip;
  ssh.stdout.on('data', function (out) {
   log.debug(logPrefix+'-out]:'+out);
   stdout+=out.toString();
  });
  ssh.stderr.on('data', function (out) {
   log.debug(logPrefix+'-err]:'+out);
   stderr+=out.toString();
  });
}

exports.SSHHost = SSHHost