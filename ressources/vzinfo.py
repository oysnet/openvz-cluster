#!/usr/bin/python 

import os
import re
from htmlentitydefs import name2codepoint
from math import ceil
from optparse import OptionParser

parser = OptionParser()
parser.add_option("-i", "--ctid", dest="ctid",
                  help="find a container by its container id")


parser.add_option("-H", "--hostname", dest="hostname",
                  help="find a container by its hostname")

(options, args) = parser.parse_args()

HOSTNAME = options.hostname
CTID = options.ctid



def unescape(s):
    return re.sub('&(%s);' % '|'.join(name2codepoint),
              lambda m: unichr(name2codepoint[m.group(1)]), s)


def getCtInfo(id):
    infos = {'description':'','ip':[],'hostname':'','ram':0}
    infos['status'] = VE_STOPPED
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

PROCVEINFO = "/proc/vz/veinfo"
VPS_CONF_DIR = "/etc/vz/conf/"

VE_STOPPED = 0
VE_RUNNING = 1
VE_MOUNTED = 2
VE_SUSPENDED = 3

ve = {}

if HOSTNAME is None and CTID is None:

    listing = os.listdir(VPS_CONF_DIR)
    for id in [f.split('.')[0] for f in listing if re.match("^[0-9]*\.conf$",f)]:
        if id == '0':
            continue
        ve[id] = getCtInfo(id)

elif CTID is not None:
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



f = open(PROCVEINFO)
for line in f:
  line = re.sub('\s+',' ',line).strip().split(' ')
  if ve.has_key(line[0]):
      ve[line[0]]['ip']=line[3:]
      ve[line[0]]['status'] = VE_RUNNING


#ve 0 is host
#del ve['0'] 

ve_json = []
for k in ve:
  v = ve[k]
  json  = '{'
  json += '"id":"%s",' % k
  json += '"status": %s,' % v['status']
  json += '"ram": %s,' % v['ram']
  json += '"swap": %s,' % v['swap']
  json += '"hostname": "%s",' % v['hostname']
  json += '"description": "%s",' % v['description'].replace('"','\\"')
  json += '"ip": [%s]' % ",".join([ '"%s"' % ip for ip in v['ip']])
  json += '}'
  ve_json.append(json)

print "[%s]" % ",".join(ve_json)

