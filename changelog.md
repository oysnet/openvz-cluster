Changelog
=========

## v0.1.1.0 - XXXXXXXXXXXXXXXXXXXX

Features

* add container gitolite to manage repositories
* add user key management, repository management, group management on container gitolite
* add this file
* container type come with type static attribute
* Host.prototype.register use  static type attribute from container
* add Host.prototype.getContainer. Take an options params that may container either hostname or id
* update ressources/vzinfo.py to work with  Host.prototype.getContainer
* add Host.prototype.getVzinfo

Bug fixes

* Container.prototype.exec is called with 2 parameters instead of 3 (command, options, callback)

