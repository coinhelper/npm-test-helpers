exports.registryUrl = function() {
  return this.scheme + '://' + this.couchUser + ':' + this.couchPass + '@' + this.host + ':' + this.port;
}
