import os, re, subprocess

def getCtVethIp(id):
    
    p = subprocess.Popen(['vzctl','exec2',id,'cat /etc/network/interfaces'],stdout=subprocess.PIPE)
    config = p.communicate()[0]
    
    p = subprocess.Popen(['vzctl','exec2',id,'ifconfig'],stdout=subprocess.PIPE)
    list = p.communicate()[0].split('\n')
    ifaces = {}
    iface = None
    for line in list:
        match = re.search('^([^ ]+) ', line)
        if match != None and match.group(1) != 'lo':
            iface = match.group(1)
        match_ip = re.search('inet addr:([0-9\.]+)', line)
        match_bcast = re.search('Bcast:([0-9\.]+)', line)
        match_mask = re.search('Mask:([0-9\.]+)', line)
            
        if match_ip != None and iface != None:
            ifaces[iface]={'ip':match_ip.group(1),'bcast':match_bcast.group(1),'mask':match_mask.group(1),'permanent' : ('address %s' % match_ip.group(1) in config != None)}
            iface=None
            
    return ifaces


def getGw(): 
    f = open('/etc/network/interfaces', 'r')
    config = f.read()
    return re.search('gateway\s+([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})', config).group(1)