var Host = require('../lib/host').Host;

var Gitolite = require('../lib/containers/gitolite').Container;
var Container = require('../lib/container').Container;
var async = require('async');

var h = new Host('10.7.35.110');

h.registerType('gitolite', Gitolite);

var git = new Gitolite({
	hostname : 'gitolite'
}, h);
git.setup(function(err) {
	
	console.log('lalalalalal')
	
	if(err !== null) {
		console.log(err);
		return;
	}
	git.addUser('hugo', "ssh-dss AAAAB3NzaC1kc3MAAACBAPmfPYN65/Def123ufh5cXs8L7hr2l1rFQjfaPIjxKG9lgQwrHwJEg1AHnA0HEkKgCkPpDHQzbLWUAKVRV+FekfJe7SaLajMSGXbO2bVo+KCT4AiHUE650CAE3VJBJ60fnqFO0xJpUrpaR/p0dOmOY4opJKLUg3suP0buuFOEU9VAAAAFQC2ZqVdudxBXUMeLQ+str1Zva5FPQAAAIBbgjF+ORWiHiUGB1SPBRh3o3NcuB7LLa1EGpq+o1q/dd6haVnIaNj59j6yBM3Gx1uhkNmA7zy8VD0Hhph4ZBROtgvwtDy0QLG9LDDe3LQjEZE/foN4f0MykK+ZUBcZjv2nUarOFq28lJ9Ap1/u7wTDzibOuVwqJDtth/HC4DZ+GQAAAIEAiLnM6AURbg8qEhGMpo3EfUzkITvKrzZtqYbNfErVERww706Shan2yWxVddBVvCWTXmvhkpKsf6Q2BEatrWgcHKgDNBsClvlFsVSLGmG5BKzYpcZAO0ka+JnQSrVt/zg8sZeX8+ohyi2osNIeY0QYDXQp9/TE0BmvVLmMSdbhX/o= hugo@anywhere", function(err) {
		if(err !== null) {
			console.log(err);
			return;
		}

		git.addUserInGroup('hugo', 'admins', function(err) {
			if(err !== null) {
				console.log(err);
				return;
			}

			git.addRepository('test_repository', function(err) {
				if(err !== null) {
					console.log(err);
					return;
				}

				git.addUser('jc', "ssh-dss BBBBB3NzaC1kc3MAAACBAPmfPYN65/Def123ufh5cXs8L7hr2l1rFQjfaPIjxKG9lgQwrHwJEg1AHnA0HEkKgCkPpDHQzbLWUAKVRV+FekfJe7SaLajMSGXbO2bVo+KCT4AiHUE650CAE3VJBJ60fnqFO0xJpUrpaR/p0dOmOY4opJKLUg3suP0buuFOEU9VAAAAFQC2ZqVdudxBXUMeLQ+str1Zva5FPQAAAIBbgjF+ORWiHiUGB1SPBRh3o3NcuB7LLa1EGpq+o1q/dd6haVnIaNj59j6yBM3Gx1uhkNmA7zy8VD0Hhph4ZBROtgvwtDy0QLG9LDDe3LQjEZE/foN4f0MykK+ZUBcZjv2nUarOFq28lJ9Ap1/u7wTDzibOuVwqJDtth/HC4DZ+GQAAAIEAiLnM6AURbg8qEhGMpo3EfUzkITvKrzZtqYbNfErVERww706Shan2yWxVddBVvCWTXmvhkpKsf6Q2BEatrWgcHKgDNBsClvlFsVSLGmG5BKzYpcZAO0ka+JnQSrVt/zg8sZeX8+ohyi2osNIeY0QYDXQp9/TE0BmvVLmMSdbhX/o= hugo@anywhere", function(err) {
					if(err !== null) {
						console.log(err);
						return;
					}
					git.addUserInGroup('jc', 'test_repository', function(err) {
						if(err !== null) {
							console.log(err);
							return;
						}
					});
				});
			})
		})
	})
});
