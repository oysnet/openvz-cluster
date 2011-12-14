#!/usr/bin/python 

import os, re, subprocess
from htmlentitydefs import name2codepoint
from math import ceil
from optparse import OptionParser

parser = OptionParser()
parser.add_option("-i", "--ctid", dest="ctid",
                  help="find a container by its container id")


parser.add_option("-H", "--hostname", dest="hostname",
                  help="find a container by its hostname")

parser.add_option("-t", "--type", dest="type",
                  help="find a container by its type")

(options, args) = parser.parse_args()

HOSTNAME = options.hostname
CTID = options.ctid
TYPE = options.type


def unescape(s):
    return re.sub('&(%s);' % '|'.join(name2codepoint),
              lambda m: unichr(name2codepoint[m.group(1)]), s)


def getCtInfo(id):
    infos = {'description':'','ip':[],'hostname':'','ram':0}
    infos['vmStatus'] = VE_STOPPED
    f = open(VPS_CONF_DIR+'/'+id+'.conf')
    for line in f:
      line = re.sub('#.*','',line).strip()
      if line != '':
        m = re.search('([A-Z_]*)="(.*)"', line)
        key = m.group(1)
        value = m.group(2).replace('\\"','"')
        if   key == 'HOSTNAME':
          infos['hostname'] = value
        elif key == 'DESCRIPTION':
          infos['description'] = unescape(value)
        elif key == 'PRIVVMPAGES':
          privvmpages = int(ceil(int(value.split(':')[0])/256.0))
        elif key == 'LOCKEDPAGES':
          infos['ram'] = int(ceil(int(value.split(':')[0])/256.0))
        
    infos['swap'] = privvmpages - infos['ram']
    
    return infos

VZLIST = "/usr/sbin/vzlist"
PROCVEINFO = "/proc/vz/veinfo"
VPS_CONF_DIR = "/etc/vz/conf/"

VE_STOPPED = 0
VE_RUNNING = 1
VE_MOUNTED = 2
VE_SUSPENDED = 3

VE_CREATED = 4
VE_INSTALLING = 5
VE_INSTALLED = 6
VE_FAIL_TO_CREATE = 7
VE_FAIL_TO_INSTALL = 8
VE_FAIL_TO_START = 9

ve = {}

if CTID is not None:
    if os.path.exists(VPS_CONF_DIR+'/'+CTID+'.conf') is True:
        ve[CTID] = getCtInfo(CTID)
    
elif HOSTNAME is not None:
    listing = os.listdir(VPS_CONF_DIR)
    for id in [f.split('.')[0] for f in listing if re.match("^[0-9]*\.conf$",f)]:
        
        if id == '0':
            continue
        
        infos = getCtInfo(id)
        
        if infos['hostname'] == HOSTNAME:
            ve[id] = infos
            break

elif TYPE is not None:
    listing = os.listdir(VPS_CONF_DIR)
    for id in [f.split('.')[0] for f in listing if re.match("^[0-9]*\.conf$",f)]:
        
        if id == '0':
            continue
        
        infos = getCtInfo(id)
       
        if '"type":"' + TYPE + '"' in infos['description']:
            ve[id] = infos
            

else:
    listing = os.listdir(VPS_CONF_DIR)
    for id in [f.split('.')[0] for f in listing if re.match("^[0-9]*\.conf$",f)]:
        if id == '0':
            continue
        ve[id] = getCtInfo(id)


f = open(PROCVEINFO)
for line in f:
  line = re.sub('\s+',' ',line).strip().split(' ')
  if ve.has_key(line[0]):
      ve[line[0]]['ip']=line[3:]
      
      #ve[line[0]]['vmStatus'] = VE_RUNNING


found_ve = {}

p = subprocess.Popen([VZLIST,"-a"],stdout=subprocess.PIPE)
list = p.communicate()[0].split('\n')
for line in list[1:]:
    line = re.sub('\s+',' ',line).strip().split(' ')
    
    if ve.has_key(line[0]):
        found_ve[line[0]] = ve[line[0]]
        if line[2] == 'running':
            vmStatus = VE_RUNNING
        else:
            vmStatus = VE_STOPPED
        
        test = re.search('"status":([0-9])', found_ve[line[0]]['description'])
        if test is not None:
            deStatus = int(test.group(1))
            
            if deStatus in [VE_CREATED, VE_INSTALLING]:
                found_ve[line[0]]['vmStatus'] = deStatus
            
            elif vmStatus == VE_STOPPED and deStatus in [VE_FAIL_TO_CREATE, VE_FAIL_TO_INSTALL,VE_FAIL_TO_START]:
                found_ve[line[0]]['vmStatus'] = deStatus
                
            else:
                found_ve[line[0]]['vmStatus'] = vmStatus
                
        else:
                found_ve[line[0]]['vmStatus'] = vmStatus

ve = found_ve

#ve 0 is host
#del ve['0'] 

ve_json = []
for k in ve:
  v = ve[k]
  json  = '{'
  json += '"id":"%s",' % k
  json += '"vmStatus": %s,' % v['vmStatus']
  json += '"ram": %s,' % v['ram']
  json += '"swap": %s,' % v['swap']
  json += '"hostname": "%s",' % v['hostname']
  json += '"description": "%s",' % v['description'].replace('"','\\"')
  json += '"ip": [%s]' % ",".join([ '"%s"' % ip for ip in v['ip']])
  json += '}'
  ve_json.append(json)

print "[%s]" % ",".join(ve_json)

