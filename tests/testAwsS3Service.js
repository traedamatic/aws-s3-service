/**
 * TestAmazonService
 *
 * this test will upload and do other operations
 * skip this test most of the times because it will load files to the s3 servers
 *
 * @author Nicolas Traeder traeder@codebility.com
 * @type {exports}
 */
var assert = require('assert'),
    expect = require('chai').expect,
    sinon = require('sinon'),
    awsSDK = require('aws-sdk');

var options = {
    bucket: 'test',
    region: 'eu-central-1',
    configPath: './../tests/tmpConfig.json'
};

var AmazonServiceConstructor = require('./../src/AwsS3Service'),
    AwsS3Service;

describe('AwsS3Service', function () {

    var sandbox,
        awsSdkConfigMock,
        awsS3ListBucketsMock;

    before(function () {
        sandbox = sinon.sandbox.create();

        awsSdkConfigMock = sandbox.stub(awsSDK.config, 'loadFromPath');
        awsS3ListBucketsMock = sandbox.stub(awsSDK.S3, 'listBuckets');

        var AwsS3Service = AmazonServiceConstructor(options);
    });

    after(function () {
        sandbox.restore();
    });

    describe.only('listMethod', function () {
        it('should return a list of buckets', function (done) {

            this.timeout(4000);

            AwsS3Service.listBuckets()
                .then(function (buckets) {
                    done(new Error('Should not pass'))

                })
                .catch(function (err) {
                    try {
                        expect(err.message).to.equal('Access Denied');
                        done()
                    } catch (e) {
                        done(e);
                    }
                });

        });
    });

    describe('uploadMethod', function () {


        it('should upload a file with parameter', function (done) {

            AwsS3Service.upload(__dirname + '/../fixtures/dummy.txt', 'dummy', 'newapikeytest')
                .then(function (data) {
                    expect(data).not.empty;
                    expect(data.name).to.be.a('string');
                    expect(data.url).to.be.a('string');
                    done();
                })
                .catch(function (err) {
                    done(err);
                });

        });

        it('should upload a file ', function (done) {

            AwsS3Service.upload(__dirname + '/../fixtures/dummy.txt','dummy.txt')
                .then(function (data) {
                    expect(data).not.empty;
                    expect(data.name).to.be.a('string');
                    expect(data.url).to.be.a('string');
                    done();
                })
                .catch(function (err) {
                    done(err);
                });

        });

        it('should throw a error if no filepath is set', function (done) {

            AwsS3Service.upload(undefined)
                .then(function (response) {
                    done(new Error('Should not pass'));
                })
                .catch(function (err) {
                    try {
                        expect(err.message).to.equal("SpotService - No filePath provided");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });

        });

        it('should throw a error if file not exists', function (done) {

            AwsS3Service.upload('path/to/dead/file')
                .then(function (response) {
                    done(new Error('Should not pass'));
                })
                .catch(function (err) {
                    try {
                        expect(err.message).to.equal("SpotService - File does not exists");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });

        });
    });

    describe('deleteMethod', function () {

        it('should throw error if no key is set', function (done) {

            AwsS3Service.removeFile(undefined)
                .then(function (response) {
                    done(new Error('Should not pass'));
                })
                .catch(function (err) {
                    try {
                        expect(err.message).to.equal("SpotService - No key provided");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('should delete a file from the aws bucket', function (done) {

            //name
            //var key = 'NiBUxcLvTES7wJ+jWwtnbQwi2dM=';
            var key = '0i0LDuyTFHVRkae8HDvfKhG0KMY=';

            //etag
            //var key = '1f710bbc31efcb1cf2ce7acd5c61c1d5';

            AwsS3Service.removeFile(key)
                .then(function (response) {
                    expect(response).to.be.an('object');
                    done();
                })
                .catch(function (err) {
                    done(err);
                });

        });
    });

    describe('listObjects', function () {

        it('should list all objects of the bucket', function (done) {

            AwsS3Service.listSpots()
                .then(function (spots) {
                    expect(spots).to.be.an('object');
                    done()
                })
                .catch(function (err) {
                    done(err);
                });
        });
    });

});
