var _ = require('lodash'),
  restify = require('restify'),
  Promise = require('bluebird'),
  exec = require('child_process').exec,
  path = require('path');

function Registry(opts) {
  _.extend(this, require(path.resolve(".") + '/config.json'), opts);
}

_.extend(Registry.prototype, require('./common'));

Registry.prototype.publish = function(package) {
  var _this = this;

  return new Promise(function(resolve, reject) {
    exec(
      'npm publish --registry=' + _this.registryUrl() + '/' + _this.testRegistryName + '/_design/app/_rewrite',
      {cwd: './fixtures/' + package}, function(err, stdout, stderr) {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
};

Registry.prototype.unpublish = function(package) {
  var _this = this,
    packageName = package.split('@')[0];

  return new Promise(function(resolve, reject) {
    exec('npm unpublish ' + packageName + ' --registry=' + _this.registryUrl() + '/' + _this.testRegistryName + '/_design/app/_rewrite --force', {cwd: './fixtures/' + package}, function(err, stdout, stderr) {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
};

module.exports = Registry;
