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
* auto add container id at the beginning of hostname
* add Container.isAlive method
* add a module to deal with container type registration
* add an errors module
* add new status CREATED INSTALLING INSTALLED FAIL_TO_CREATE FAIL_TO_INSTALL FAIL_TO_START
* delay addContainer event when container has no type, take care of that on Host.afterInit
* add Count supervisor
* add HA supervisor

Bug fixes

* Container.prototype.exec is called with 2 parameters instead of 3 (command, options, callback)

