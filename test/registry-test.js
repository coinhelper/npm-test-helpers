var Lab = require('lab'),
  Couch = require('../lib').Couch,
  Registry = require('../lib').Registry,
  restify = require('restify'),
  config = require('../test-config'),
  client = restify.createJsonClient({
    url: config.scheme + '://' + config.couchUser + ':' + config.couchPass + '@' + config.host + ':' + config.port
  });

Lab.experiment('registry', function() {

  // delete the registry DB before each test run.
  Lab.before(function(done) {
    client.del('/' + config.testRegistryName, function(err, req, res, obj) {
      (new Couch()).setup().then(function() {
        done();
      });
    });
  });

  Lab.experiment('publish', function() {

    Lab.it('should allow a dependency from the project to be published', function(done) {
      var registry = new Registry();

      registry.publish('request@1.9.0').then(function(stdout) {
        Lab.expect(stdout).to.eql('+ request@1.9.0')
        done();
      }).done();
    });

    Lab.it('should raise an exception if the same package version is published twice', function(done) {
      var registry = new Registry();

      registry.publish('tap@0.3.0').then(function() {
        return registry.publish('tap@0.3.0')
      }).catch(function(err) {
        Lab.expect(err.message).to.match(/cannot modify pre-existing version/);
        done();
      }).done();

    });

    Lab.it('should handle publishing a package, followed by an update', function(done) {
      var registry = new Registry();

      registry.publish('thumbd@2.7.0').then(function(stdout) {
        Lab.expect(stdout).to.eql('+ thumbd@2.7.0')
        return registry.publish('thumbd@2.8.1')
      }).then(function(stdout) {
        Lab.expect(stdout).to.eql('+ thumbd@2.8.1');
        done();
      }).done();
    });
  });

  Lab.experiment('unpublish', function() {
    Lab.it('should allow a package to be unpublished', function(done) {
      var registry = new Registry();

      registry.unpublish('request@1.9.0').then(function(stdout) {
        Lab.expect(stdout).to.eql('- request');
        done();
      }).done();
    });
  });

  Lab.experiment('delete', function() {
    Lab.it('should delete the package from the regsitry', function(done) {
      var registry = new Registry();

      registry.delete('request').then(function(obj) {
        Lab.expect(obj.ok).to.eql(true);
        done();
      }).done();
    });
  });

});
