import os

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import channel

import datetime

import pusher
import json

from credentials import app_id, key, secret

class MainHandler(webapp.RequestHandler):
  def get (self, q):
    if q is None:
      q = 'index.html'

    path = os.path.join (os.path.dirname (__file__), q)
    self.response.headers ['Content-Type'] = 'text/html'
    self.response.out.write (template.render (path, {}))

class ChannelHandler(webapp.RequestHandler):
    def post(self):
        channel_name = self.request.get('channel_name')
        socket_id = self.request.get('socket_id')

        p = pusher.Pusher(app_id=app_id, key=key, secret=secret)

        auth = p[channel_name].authenticate(socket_id)
        json_data = json.dumps(auth)

        self.response.out.write(json_data)

    def get (self, q):
        if q is None or q == '':
            q = 'index.html'

        path = os.path.join (os.path.dirname (__file__), q)
        print path
        self.response.headers ['Content-Type'] = 'text/html'
        self.response.out.write (template.render (path, {}))

application = webapp.WSGIApplication([('/pusher/auth', ChannelHandler), ('/(.*html)?', MainHandler)],
                                     debug=True)

def main():
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
