from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import channel
from google.appengine.ext import db

import datetime

class Token(db.Model):
    id = db.StringProperty(required=True)
    created = db.StringProperty(required=True)

class ChannelHandler(webapp.RequestHandler):

    token = {}
    age = 0

    def getTokenAgeMinutes(self, created):        
        return (datetime.datetime.utcnow() - created).days * 24 * 60 + (datetime.datetime.utcnow() - created).seconds // 60

    def fetchToken(self):
        tokens = db.GqlQuery("SELECT * FROM Token")

        found = False
        token = {}
        for t in tokens:
            found = True
            token = t
            break

        if found:
            self.age = self.getTokenAgeMinutes(datetime.datetime.strptime(token.created, "%Y-%m-%d %H:%M:%S.%f"))

            if self.age >= 120:
                token.id = channel.create_channel('anon')
                token.created = str(datetime.datetime.utcnow())                
                token.put()
                self.age = 0
        else:
            token = Token(id = channel.create_channel('anon'), created = str(datetime.datetime.utcnow()))
            token.put()
            self.age = 0

        self.token = token

    def options(self):
        self.response.headers.add_header("Access-Control-Allow-Origin", "http://localhost:12080")

    def get(self):                                                
        self.fetchToken()

        data = {}
        data['token'] = self.token.id
        data['age'] = self.age
        data['created'] = self.token.created

        self.response.headers.add_header("Content-Type", "application/json; charset=utf-8")        
        self.response.headers.add_header("Access-Control-Allow-Origin", "http://localhost:12080")
        self.response.out.write(str(data))

    def post(self):                
        msg = self.request.headers["X-Car-Message"]        
        self.response.headers.add_header("Access-Control-Allow-Origin", "http://localhost:12080")
        self.response.headers.add_header("Access-Control-Allow-Origin", "http://raspeyecar.appspot.com")
        
        if msg is None:
            self.response.error(400)
            self.response.out.write('X-Car-Message header is missing')
        else:            
            channel.send_message('anon', msg)
		
application = webapp.WSGIApplication([('/', ChannelHandler)],
                                     debug=True)

def main():
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main()
