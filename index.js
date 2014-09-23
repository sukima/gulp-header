/* jshint node: true */
'use strict';

var through = require('through2');
var gutil = require('gulp-util');
var extend = require('lodash.assign');
var SourceMapGenerator = require('source-map').SourceMapGenerator;
var SourceMapConsumer = require('source-map').SourceMapConsumer;

var headerPlugin = function(headerText, data) {
    headerText = headerText || '';

    var stream = through.obj(function(file, enc, cb) {

        var template = gutil.template(headerText, extend({file : file}, data));

        if (file.isBuffer()) {
            file.contents = Buffer.concat([
                new Buffer(template),
                file.contents
            ]);
        }

        if (file.isStream()) {
            var stream = through();
            stream.write(new Buffer(template));
            stream.on('error', this.emit.bind(this, 'error'));
            file.contents = file.contents.pipe(stream);
        }

        if (file.sourceMap) {
            var lines = template.split(/\r\n|\r|\n/).length;
            var smc = new SourceMapConsumer(file.sourceMap);
            var generator = SourceMapGenerator.fromSourceMap(smc);

            smc.eachMapping(function(mapping) {
                var adjuster = (lines === 1) ? 'column' : 'line';
                var offset = lines > 1 ? lines : template.length;
                var generated = {
                    line: mapping.generatedLine,
                    column: mapping.generatedColumn
                };

                generated[adjuster] += offset;

                generator.addMapping({
                    original: {
                        line: mapping.originalLine,
                        column: mapping.originalColumn
                    },
                    generated: generated,
                    source: mapping.source,
                    name: mapping.name
                });
            });

            file.sourceMap = JSON.parse(generator.toString());
        }

        // make sure the file goes through the next gulp plugin
        this.push(file);
        // tell the stream engine that we are done with this file
        cb();
    });

    // returning the file stream
    return stream;
};

module.exports = headerPlugin;
