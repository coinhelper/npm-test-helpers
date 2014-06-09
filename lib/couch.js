var _ = require('lodash'),
  restify = require('restify'),
  Promise = require('bluebird'),
  exec = require('child_process').exec,
  path = require('path');

function Couch(opts) {
  _.extend(this, require(path.resolve(".") + '/config.json'), opts);
}

_.extend(Couch.prototype, require('./common'));

// Create a registry for testing the npm-client.
Couch.prototype.setup = function() {
  var _this = this;

  return new Promise(function(resolve, reject) {
    _this._createClient().put('/' + _this.testRegistryName, function(err, req, res, obj) {
      if (err && err.message.match(/the file already exists/)) resolve(true);
      if (err) reject(err);
      else resolve();
    });
  }).then(function(exists) {
    // only populate the design documents if the
    // database was just created.
    if (!exists && _this.populateDesign) return _this._populateDesigns();
    else return true;
  });
};

Couch.prototype._populateDesigns = function() {
  var _this = this;

  return this._pushApp().then(function() {
    return _this._pushAuth();
  }).then(function() {
    return _this._loadViews();
  }).then(function() {
    return _this._copyViews();
  });
};

Couch.prototype._pushApp = function() {
  return this._runCommand('./node_modules/.bin/couchapp push registry/app.js ' + this.registryUrl() + '/' + this.testRegistryName);
};

Couch.prototype._pushAuth = function() {
  return this._runCommand('./node_modules/.bin/couchapp push registry/app.js ' + this.registryUrl() + '/_users')
};

Couch.prototype._loadViews = function() {
  return this._runCommand('npm run load --npm-registry-couchapp:couch=' + this.registryUrl() + '/' + this.testRegistryName);
};

Couch.prototype._copyViews = function() {
  return this._runCommand('npm run copy --npm-registry-couchapp:couch=' + this.registryUrl() + '/' + this.testRegistryName);
};

Couch.prototype._runCommand = function(command) {
  var _this = this;

  return new Promise(function(resolve, reject) {
    exec(
      command,
      {
        cwd: './node_modules/npm-registry-couchapp',
        env: _.extend(process.env, {
          NO_PROMPT: '1',
          DEPLOY_VERSION: 'testing'
        })
      },
      function(err, stdout, stderr) {
        if (err) reject(err);
        else resolve(stdout.trim());
      }
    );
  });
};

// Destroy the testing registry.
Couch.prototype.teardown = function() {
  var _this = this;

  return new Promise(function(resolve, reject) {
    _this._createClient().del('/' + _this.testRegistryName, function(err, req, res, obj) {
      if (err && err.message.match(/missing/)) resolve();
      if (err) reject(err);
      else resolve();
    });
  });
};

Couch.prototype._createClient = function() {
  return restify.createJsonClient({
    url: this.registryUrl()
  })
};

module.exports = Couch;
