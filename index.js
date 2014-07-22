/* jshint node: true */
'use strict';

var es = require('event-stream');
var gutil = require('gulp-util');
var extend = require('lodash.assign');

var headerPlugin = function(headerText, data) {
  headerText = headerText || '';
  return es.map(function(file, cb){
    file.pipe(es.wait(function(err, contents){
      if (err) return cb(err);
      file.contents = Buffer.concat([
        new Buffer(gutil.template(headerText, extend({file : file}, data))),
        contents
      ]);
      cb(null, file);
    }));
  });
};

module.exports = headerPlugin;
