import webapp2


class TestPage(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.write('Test successful')


app = webapp2.WSGIApplication([
    ('/api/test', TestPage),
], debug=True)
