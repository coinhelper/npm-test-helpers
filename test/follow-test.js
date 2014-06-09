var Lab = require('lab'),
  Couch = require('../lib').Couch,
  Registry = require('../lib').Registry,
  restify = require('restify'),
  config = require('../config.json'),
  follow = require('follow'),
  normalize = require('npm-normalize'),
  url = config.scheme + '://' + config.couchUser + ':' + config.couchPass + '@' + config.host + ':' + config.port,
  client = restify.createJsonClient({
    url: url
  });

Lab.experiment('follow', function() {

  // delete the registry DB before each test run.
  Lab.before(function(done) {
    client.del('/' + config.testRegistryName, function(err, req, res, obj) {
      (new Couch()).setup().then(function() {
        done();
      });
    });
  });

  Lab.it('should receive an event when a package is published', function(done) {
    var feed = follow({
      db: url + '/' + config.testRegistryName,
      include_docs: true,
      since: 'now'
    }, function(err, change) {
      var doc = normalize(change.doc);
      Lab.expect(doc.name).to.eql('request');
      Lab.expect(doc.version).to.eql('1.9.0');
      feed.stop();
      done();
    });

    feed.on('catchup', function() {
      (new Registry()).publish('request@1.9.0').done();
    })
  });

  Lab.it('should receive an event when a package is unpublished', function(done) {
    var feed = follow({
      db: url + '/' + config.testRegistryName,
      include_docs: true,
      since: 'now'
    }, function(err, change) {
      Lab.expect(change.doc.time.unpublished).to.be.an('object');
      feed.stop();
      done();
    });

    feed.on('catchup', function() {
      (new Registry()).unpublish('request@1.9.0').done();
    })
  });

});
