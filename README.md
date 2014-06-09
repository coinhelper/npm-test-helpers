# npm-test-helpers

Useful shared test helpers for writing apps that interact with npm.

## Registry-Couch-App Integration Testing

It can be useful to test against a fully-functional Registry-Couch-App.
*npm-test-helpers* provides a useful set of helpers for doing this.

**setting up your local environment**

1. Edit your `local.ini` to have the settings outlined in https://github.com/npm/npm-registry-couchapp.
2. Create a `test-config.json` that has appropriate settings for your CouchDB configuration:

```json
{
  "testRegistryName": "npm-test-registry",
  "host": "localhost",
  "port": 5984,
  "scheme": "http",
  "cache": "/tmp",
  "couchUser": "admin",
  "couchPass": "admin",
  "populateDesign": true
}
```

**initializing a testing registry**

```javascript
Couch = require('../lib').Couch;

couch.setup().then(function() {
  // a registry is now available with the
  // design documents populated.
});
```

**tearing down the testing registry**

```javascript
var Couch = require('npm-test-helpers').Couch;

couch.teardown().then(function() {
  // the testing registry has been destroyed.
});
```

**publishing a package**

1. make sure that you have an npm user available locally (*npm-test-helpers* simply executes npm).
2. create a testing registry.
3. for testing purposes, the following packages are available:
  * **request@1.9.0**
  * **request@2.36.0**
  * **tap@0.3.0**
  * **thumbd@2.7.0**
  * **thumbd@2.8.1**

```javascript
var Couch = require('npm-test-helpers').Couch,
 Registry = require('npm-test-helpers').Registry;

couch.setup().then(function() {
  var registry = new Registry();
  registry.publish('request@2.36.0').then(function(stdout) {
    // the package is now published.
  });
});
```

**unpublish a package**

```javascript
var Couch = require('npm-test-helpers').Couch,
 Registry = require('npm-test-helpers').Registry;

couch.setup().then(function() {
  var registry = new Registry();
  registry.publish('request@2.36.0').then(function(stdout) {
    return registry.unpublish('request');
  }).then(function(stdout) {
    // the package was unpublished.
  });
});
```

**testing a follower feed**

We use followers all over the place, for different pieces of npm's architecture,
*npm-test-helpers* makes it easy to perform inegration tests on followers.

*listening for a publication event*

```javascript
var Couch = require('npm-test-helpers').Couch,
 Registry = require('npm-test-helpers').Registry;

couch.setup().then(function() {

  var feed = follow({
    db: url + '/' + config.testRegistryName,
    include_docs: true,
    since: 'now'
  }, function(err, change) {
    // change.doc.time.unpublished will be
    // an object.
  });

  feed.on('catchup', function() {
    (new Registry()).unpublish('request@1.9.0').done();
  })
});
```
