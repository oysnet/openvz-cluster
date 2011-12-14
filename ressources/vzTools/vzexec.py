#! /bin/sh
""":"
exec python $0 ${1+"$@"}
""" 
from optparse import OptionParser
from tools import getCtVethIp, getGw
import subprocess
import pickle
import ipcalc

parser = OptionParser()
parser.add_option("--ipadd", dest="ipadd")
parser.add_option("--ipdel", dest="ipdel")
parser.add_option("--save", dest="save", default=False, action="store_true")
(options, args) = parser.parse_args()

options.command = args[0]
options.ctid = args[1]
if options.command != 'set':
    exit(1)


    

if options.ipadd is not None:
    ifaces = getCtVethIp(options.ctid)
    ip = options.ipadd.split('/')[0]
    netmask = '32' if len(options.ipadd.split('/')) == 1 else options.ipadd.split('/')[1] 
        
    iface = None    
    for n in range(0,10):
        if not ifaces.has_key('eth%s' % n):
            iface = 'eth%s' % n
            break
        elif ifaces['eth%s' % n]['ip'] == ip: #@todo netmask
            exit(0)
    
    if iface is None:
        print "Can't find iface"    
        exit(1)
    if options.save:
        p = subprocess.call(['vzctl','set',options.ctid,'--netif_add',iface,'--save'])
        
        #add ip on ifaces ipcalc.Network('10.7.50.0/255.255.255.0').broadcast()
        ifaces[iface] = {
            'ip': ip,
            'bcast': ipcalc.Network("%s/%s" % (options.ipadd,netmask)).broadcast(),
            'mask': ipcalc.Network("%s/%s" % (options.ipadd,netmask)).netmask(),
            'permanent': True
        }
        if ifaces[iface]['bcast'] == ip:
            ifaces[iface]['bcast'] = '0.0.0.0'
        
        networking = """
            #ok
            auto lo
            iface lo inet loopback
            
            """
        route_set = False
        for iface in ifaces:
            print ifaces[iface]
            if not ifaces[iface]['permanent']:
                continue
            networking += """
            
            auto %(iface)s
            iface %(iface)s inet static
            broadcast %(bcast)s
            address %(ip)s
            netmask %(mask)s
            """ % {
                   'iface' : iface,
                   'bcast' : ifaces[iface]['bcast'],
                   'ip' : ifaces[iface]['ip'],
                   'mask' : ifaces[iface]['mask']
                   }
            if not route_set :
                route_set = True
                networking += """
            up ip route add %(gw)s dev %(iface)s  scope link
            up ip route add default via %(gw)s dev %(iface)s
            """ % {
                 'gw' : getGw(),
                 'iface': iface
                 }
            
            networking += "\n"
        p = subprocess.call(['ifconfig','veth%s.%s' % (options.ctid,n)])
        p = subprocess.call(['echo','1','> /proc/sys/net/ipv4/conf/veth%s.%s/forwarding' % (options.ctid,n)])
        p = subprocess.call(['echo','1','> /proc/sys/net/ipv4/conf/veth%s.%s/proxy_arp' %  (options.ctid,n)])
        p = subprocess.call(['vzctl','exec2',options.ctid,'echo "%s"' % networking,'>/etc/network/interfaces'])
        p = subprocess.call(['vzctl','exec2',options.ctid,'/etc/init.d/networking restart'])
        p = subprocess.call(['ip','route','flush','cache'])
        p = subprocess.call(['arp','-d',ip])

            
            
    else:
        p = subprocess.call(['vzctl','set',options.ctid,'--netif_add',iface])
        p = subprocess.call(['vzctl','exec2',options.ctid,'ifconfig',iface,'%s/%s' % (ip,netmask)])
    

if options.ipdel is not None:
    ifaces = getCtVethIp(options.ctid)
    ip = options.ipdel.split('/')[0]
    netmask = '32' if len(options.ipdel.split('/')) == 1 else options.ipdel.split('/')[1] 
    
    iface = None    
    for n in range(0,10):
        if ifaces.has_key('eth%s' % n) and ifaces['eth%s' % n]['ip'] == ip:
            iface = 'eth%s' % n
    
    if iface is None:
        print "Can't find iface"    
        exit(1)

    if options.save:        
        p = subprocess.call(['vzctl','set',options.ctid,'--netif_del',iface])    
        p = subprocess.call(['ip','route','flush','cache'])
    else:
        p = subprocess.call(['vzctl','set',options.ctid,'--netif_del',iface,'--save'])    
        p = subprocess.call(['ip','route','flush','cache'])

