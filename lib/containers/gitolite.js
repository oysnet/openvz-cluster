var util = require('util'), log = require('czagenda-log').from(__filename), Container = require('../container').Container;

var Gitolite = function Gitolite() {
	Container.apply(this, Array.prototype.slice.call(arguments));

};
util.inherits(Gitolite, Container);

Gitolite.type = 'Gitolite';


Gitolite.prototype.getSetupTasks = function() {
	return [this.installGitolite.bind(this)];
}

Gitolite.prototype.installGitolite = function(callback) {
	log.info('Instal gitolite');
	this
			.exec(
					[
							'apt-get update',
							'apt-get -y install git',
							'useradd -m -s /bin/bash git',
							'ssh-keygen -q -N "" -t dsa -f /root/.ssh/id_dsa',
							'cp /root/.ssh/id_dsa.pub /home/git/admin.pub',
							'chown git.git /home/git/admin.pub',
							'echo \'PATH=/home/git/bin:$PATH\' >> /home/git/.bashrc',
							'su git -c "cd ~/;git clone git://github.com/sitaramc/gitolite;gitolite/src/gl-system-install;PATH=$PATH:/home/git/bin gl-setup -q ~/admin.pub &&  mv /home/git/share/gitolite/hooks/common/update.secondary.sample /home/git/share/gitolite/hooks/common/update.secondary && chmod +x /home/git/share/gitolite/hooks/common/update.secondary && mkdir /home/git/share/gitolite/hooks/common/update.secondary.d"',
							'ssh -o "StrictHostKeyChecking no" git@localhost', // add
																				// key
																				// finger
																				// print
							'cd /root/; git clone git@localhost:gitolite-admin',
							'echo "@admins = "> /root/gitolite-admin/conf/gitolite.conf',
							'echo " " >> /root/gitolite-admin/conf/gitolite.conf',
							'echo "repo	gitolite-admin" >> /root/gitolite-admin/conf/gitolite.conf',
							'echo "    	RW+ = admin @admins" >> /root/gitolite-admin/conf/gitolite.conf',
							'cd /root/gitolite-admin; git config --global user.name "System";git config --global user.email admin@oxys.net; git commit -am "initial setup"; git push origin master']
							.join(' && '), null, function(err, res) {
						if (err) {
							log.warning('Gitolite install failed', err);
							callback(err);
							return;
						}
						log.info('Gitolite install done');

						callback();
					}.bind(this));
}

Gitolite.prototype.addRepository = function(name, callback) {
	this.exec([
					'cd /root/gitolite-admin/',
					'git pull',
					'echo " " >> conf/gitolite.conf',
					'echo "@' + name + ' = " >> conf/gitolite.conf',
					'echo "repo	' + name + '" >> conf/gitolite.conf',
					'echo "    	RW+ = admin @admins @' + name
							+ '" >> conf/gitolite.conf',
					'git commit -am "add repositoriy ' + name + '"',
					'git push origin master'].join(' && '), null, callback);
}

Gitolite.prototype.addUser = function(user, key, callback) {
	this.exec(['cd /root/gitolite-admin/', 'git pull',
					'echo "' + key + '" > keydir/' + user + '.pub',
					'git add --all', 'git commit -am "add user ' + user + '"',
					'git push origin master'].join(' && '), null, callback);
}

Gitolite.prototype.addUserInGroup = function(user, group, callback) {
	this
			.exec(
					[
							'cd /root/gitolite-admin/',
							'git pull',
							'cat conf/gitolite.conf | sed -e "s/@' + group
									+ ' =/@' + group + ' = ' + user
									+ '/" > conf/gitolite.conf~',
							'mv conf/gitolite.conf~ conf/gitolite.conf',
							'git commit -am "add user ' + user + ' in group '
									+ group + '"', 'git push origin master']
							.join(' && '), null, callback);
}

exports.Container = Gitolite