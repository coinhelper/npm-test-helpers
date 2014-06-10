var _ = require('lodash'),
  restify = require('restify'),
  Promise = require('bluebird'),
  exec = require('child_process').exec,
  path = require('path');

function Registry(opts) {
  _.extend(this, require(path.resolve(".") + '/test-config'), opts);
}

_.extend(Registry.prototype, require('./common'));

Registry.prototype.publish = function(package) {
  var _this = this;

  return new Promise(function(resolve, reject) {
    exec(
      'npm publish --registry=' + _this.registryUrl() + '/' + _this.testRegistryName + '/_design/app/_rewrite',
      {cwd: __dirname + '/../fixtures/' + package}, function(err, stdout, stderr) {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
};

Registry.prototype.unpublish = function(package) {
  var _this = this,
    packageName = package.split('@')[0];

  return new Promise(function(resolve, reject) {
    exec('npm unpublish ' + packageName + ' --registry=' + _this.registryUrl() + '/' + _this.testRegistryName + '/_design/app/_rewrite --force', {cwd: __dirname + '/../fixtures/' + package}, function(err, stdout, stderr) {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
};

Registry.prototype.delete = function(packageName) {
  var _this = this,
    client = restify.createJsonClient({
      url: _this.registryUrl()
    });

  return new Promise(function(resolve, reject) {
    client.get('/' + _this.testRegistryName + '/' + packageName, function(err, req, res, obj) {
      if (err) reject(err);
      else {
        client.del('/' + _this.testRegistryName + '/' + packageName + '?rev=' + obj._rev, function(err, req, res, obj) {
          if (err) reject(err);
          else resolve(obj);
        });
      }
    });
  });
};

module.exports = Registry;
