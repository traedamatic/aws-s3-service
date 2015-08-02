'use strict';

var crypto = require('crypto'),
    Promise = require('bluebird'),
    fs = require('fs'),
    mime = require('mime'),
    path = require('path'),
    AwsS3Service,
    awsSDK = require('aws-sdk');

/**
 * Amazon Service for uploading images and more
 *
 * @author Nicolas Traeder traeder@codebility.com
 * @constructor
 */
AwsS3Service = function (options) {
    if (!options.configPath) {
        throw new Error('Config path in options missing');
    }

    if (!options.bucket) {
        throw new Error('Bucket name in options missing');
    }

    if (!options.region) {
        throw new Error('AWS region in options missing');
    }

    this.bucketName = options.bucket;
    this.region = options.region;



    //load and config the aws sdk
    this.aws = awsSDK;
    this.aws.config.loadFromPath(options.configPath);

    //create s3 service
    this.S3 = new this.aws.S3({apiVersion: '2006-03-01'});

    //private function, just wrap file exists function of node
    this._fileExists = function (file) {

        return new Promise(function (resolve, reject) {
            fs.exists(file, function (result) {
                return resolve(result);
            });
        });
    }
};

/**
 * parse the url from bucket, region and path
 * @param path
 * @returns {string}
 */
AwsS3Service.prototype.parseUrl = function (path) {

    var urlPattern = 'https://s3-#region#.amazonaws.com/#bucket#',
        url = urlPattern.replace('#bucket#',this.bucketName);

    url = url.replace('#region#',this.region);
    url = url + '/' + path;

    return url

};

/**
 * list all buckets of the account
 */
AwsS3Service.prototype.listBuckets = function () {

    var self = this;

    return new Promise(function (resolve, reject) {
        self.S3.listBuckets(function (err, data) {
            console.log(err);
            if(err) {
                return reject(err);
            }
            return resolve(data);
        });
    });
};

/**
 * upload a file to the bucket
 * @returns {Promise}
 * @param {string} filePath
 * @param customName
 * @param fileName
 */
AwsS3Service.prototype.upload = function (filePath, fileName, customName, withoutHash) {

    var self = this;

    return new Promise(function (resolve, reject) {

        if(!filePath) {
            return reject(new Error('AwsS3Service - No filePath provided'));
        }

        var fileHash = null;
        var awsFilename = null;

        self._fileExists(filePath)
            .then(function (exists) {
                if(exists) {

                    if (withoutHash !== true) {
                        //create hash
                        var hash = crypto.createHash('sha1');
                        hash.setEncoding('hex');
                        hash.write(filePath + new Date().getTime());
                        hash.end();
                        fileHash = hash.read();


                        if(customName && typeof customName == 'string') {
                            awsFilename = customName + '_' + fileHash;
                        } else {
                            awsFilename = fileHash;
                        }
                    } else {
                        awsFilename = customName;
                    }


                    //read file
                    var fileBuffer = fs.readFileSync(filePath);

                    //mime type and add extension to file
                    var mimeType = mime.lookup(fileName);
                    var extension = mime.extension(mimeType);

                    awsFilename = awsFilename + '.' + extension;

                    //build parameter for putObject
                    var parameter = {
                        ACL: 'public-read',
                        Bucket: self.bucketName,
                        Key: awsFilename,
                        Body: fileBuffer,
                        ContentType: mimeType
                    };


                    return new Promise(function (resolve, reject) {
                        //put object to aws
                        self.S3.putObject(parameter, function (err, response) {
                            if (err) {
                                return reject(err);
                            }
                            return resolve(response);
                        });
                    });

                } else {
                    return reject(new Error('AwsS3Service - File does not exists'));
                }
            })
            .then(function (response) {
                response['name'] = awsFilename;
                response['url'] = self.parseUrl(awsFilename);

                return resolve(response);
            })
            .catch(reject);

    });

};

/**
 * delete a file from bucket
 * @param {string} key
 * @returns {Promise}
 */
AwsS3Service.prototype.removeFile = function (key) {

    var self = this;

    return new Promise(function (resolve, reject) {

        if(!key) {
            return reject(new Error('AwsS3Service - No key provided'));
        }

        var params = {
            Bucket: self.bucketName,
            Key: key
        };

        self.S3.deleteObject(params, function(err, data) {
            if (err) {
                return reject(err);
            }

            return resolve(data);

        });
    });
};

/**
 * list s3 objects
 * @returns {Promise}
 */
AwsS3Service.prototype.listObjects = function () {

    var self = this;

    return new Promise(function (resolve, reject) {

        var params = {
            Bucket: self.bucketName
        };

        self.S3.listObjects(params, function (err, objects) {
            if (err) {
                return reject(err);
            } else {
                return resolve(objects);
            }
        });
    })



};


/**
 *
 * @param {Array} options
 * @returns {AwsS3Service}
 */
module.exports = function (options) {
    if (!options) {
        throw  new Error('Please provide options for the aws s3 service')
    }
    return new AwsS3Service(options);
};