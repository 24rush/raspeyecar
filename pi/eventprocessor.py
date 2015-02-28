import pusherclient
import os
import socket

from credentials import app_key, secret

if os.name != "nt":
    import fcntl
    import struct

class EventProcessor():
    def __init__(self):
        self.pusher = pusherclient.Pusher(key=app_key, secret=secret)

        self.pusher.connection.bind('pusher:connection_established', self.on_connect_handler)
        self.pusher.connect()

    def on_connect_handler(self, data):
        self.channel = self.pusher.subscribe('private-test_channel')

        self.channel.bind('client-direction_event', self.direction_handler)
        self.channel.bind('client-whois_event', self.whois_handler)

        self.trigger_heartbeat();

    def direction_handler(self, msg):
        print(msg)

    def whois_handler(self, msg):
        print ('Received whois...')
        self.trigger_heartbeat();

    def trigger_heartbeat(self):
        ip, iface = self.get_lan_ip()
        self.channel.trigger('client-heartbeat_event', { 'msg': 'ON', 'ip' : ip, 'iface' : iface});

    def get_interface_ip(self, ifname):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        return socket.inet_ntoa(fcntl.ioctl(s.fileno(), 0x8915, struct.pack('256s',
                                ifname[:15]))[20:24])

    def get_lan_ip(self):
        iface = 'local'
        ip = socket.gethostbyname(socket.gethostname())
        if ip.startswith("127.") and os.name != "nt":
            interfaces = [
                "eth0",
                "eth1",
                "eth2",
                "wlan0",
                "wlan1",
                "wifi0",
                "ath0",
                "ath1",
                "ppp0",
                ]
            for ifname in interfaces:
                try:
                    ip = self.get_interface_ip(ifname)
                    iface = ifname
                    break
                except IOError:
                    pass
        return ip, iface
