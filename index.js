/**
 * export the service a node module
 * @type {function(): AwsS3Service|exports}
 */
var AwsS3Service = require('./src/AwsS3Service');
module.exports = AwsS3Service;