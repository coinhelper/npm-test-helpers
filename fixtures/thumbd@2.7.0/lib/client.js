var aws = require('aws-sdk'),
	config = require('./config').Config,
	Saver = require('./saver').Saver,
	_ = require('underscore');

/**
 * Initialize the Client
 *
 * @param object opts The Client options
 */
function Client(opts) {

	// allow sqs to be overridden
	// in tests.
	if (opts && opts.sqs) {
		this.sqs = opts.sqs;
		delete opts.sqs;
	} else {
		this.sqs = new aws.SQS({
			accessKeyId: config.get('awsKey'),
			secretAccessKey: config.get('awsSecret'),
			region: config.get('awsRegion')
		});
	}

	config.extend(opts);

	config.set('sqsQueueUrl', this.sqs.endpoint.protocol + '//' + this.sqs.endpoint.hostname + '/' + config.get('sqsQueue'));
}

/**
 * Upload a local file to S3, so that we can later thumbnail it.
 *
 * @param string source path to local file.
 * @param string destination key of file in remote s3 bucket.
 * @param function callback fired when image is uploaded. Optional.
 */
Client.prototype.upload = function(source, destination, callback) {
	var saver = new Saver();
	saver.save(source, destination, callback);
};

/**
 * Submit a thumbnailing job over SQS.
 *
 * @param string originalImagePaths Path to the image in S3 that thumbnailing should be performed on,
 *    can optionally be an array of resources.
 * @param array thumbnailDescriptions Thumbnailing meta information, see README.md.
 * @param object opts additional options
 *   @opt prefix alternative prefix for saving thumbnail.
 * @param function callback The callback function. Optional.
 */
Client.prototype.thumbnail = function(originalImagePaths, thumbnailDescriptions, opts, callback) {
	/**
		job = {
			"resources": [
				"/foo/awesome.jpg"
			],
			"prefix": "/foo/awesome",
			"descriptions": [{
				"suffix": "small",
				"width": 64,
				"height": 64
			}],
		}
	*/

	// additional options can be provided.
	if (typeof opts === 'function') {
		callback = opts;
		opts = {};
	}

	// allow for either a single S3 resource, or an array.
	if (!_.isArray(originalImagePaths)) originalImagePaths = [originalImagePaths];

	// override defaults with opts.
	opts = _.extend({
		prefix: originalImagePaths[0].split('.').slice(0, -1).join('.')
	}, opts);

	this.sqs.sendMessage({QueueUrl: config.get('sqsQueueUrl'), MessageBody: JSON.stringify({
		resources: originalImagePaths,
		prefix: opts.prefix,
		descriptions: thumbnailDescriptions
	})}, function (err, result) {
		if (callback) callback(err, result);
	});
};

exports.Client = Client;
