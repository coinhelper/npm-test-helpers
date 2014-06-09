var Lab = require('lab'),
  Couch = require('../lib').Couch,
  nock = require('nock'),
  restify = require('restify'),
  config = require('../test-config'),
  client = restify.createJsonClient({
    url: config.scheme + '://' + config.couchUser + ':' + config.couchPass + '@' + config.host + ':' + config.port
  });

Lab.experiment('couch', function() {

  // delete the registry DB before each test run.
  Lab.beforeEach(function(done) {
    client.del('/' + config.testRegistryName, function(err, req, res, obj) {
      done();
    });
  });

  Lab.experiment('setup', function() {
    Lab.it('should create the testing registry', function(done) {
      var couch = new Couch({
        populateDesign: false
      });
      couch.setup().then(function() {
        client.get('/npm-test-registry', function(err, req, res, obj) {
          Lab.expect(obj.db_name).to.eql('npm-test-registry');
          done();
        });
      });
    });

    Lab.it('should perform a no-op if the database already exists', function(done) {
      var couch = new Couch({
        populateDesign: false
      });
      couch.setup().then(function() {return couch.setup();}).then(function() {

        client.get('/npm-test-registry', function(err, req, res, obj) {
          Lab.expect(obj.db_name).to.eql('npm-test-registry');
          done();
        });

      });
    });

    Lab.it('should raise an exception if another class of error occurs', function(done) {
      var couch = new Couch({
        populateDesign: false
      });

      var createDB = nock('http://localhost:5984')
        .put('/npm-test-registry')
        .reply(500);

      couch.setup().catch(function(err) {
        err.statusCode.should == 500;
        createDB.done();
        done();
      });
    });
  });

  Lab.experiment('teardown', function() {
    Lab.it('should destroy the testing registry', function(done) {
      var couch = new Couch({
        populateDesign: false
      });
      couch.setup().then(function() {return couch.teardown();}).then(function() {

        client.get('/npm-test-registry', function(err, req, res, obj) {
          Lab.expect(res.statusCode).to.eql(404);
          done();
        });

      });
    });

    Lab.it('should not raise an exception if the registry is already destroyed', function(done) {
      var couch = new Couch({
        populateDesign: false
      });
      couch.teardown().then(function() {

        client.get('/npm-test-registry', function(err, req, res, obj) {
          Lab.expect(res.statusCode).to.eql(404);
          done();
        });

      });
    });

    Lab.it('should raise an exception if another class of error occurs', function(done) {
      var couch = new Couch({
        populateDesign: false
      });

      var createDB = nock('http://localhost:5984')
        .delete('/npm-test-registry')
        .reply(500);

      couch.teardown().catch(function(err) {
        err.statusCode.should == 500;
        createDB.done();
        done();
      });
    });

  });

});
