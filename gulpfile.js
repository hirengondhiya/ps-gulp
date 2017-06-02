var gulp = require('gulp');
var args = require('yargs').argv;
var config = require('./gulp.config')();

var $ = require('gulp-load-plugins')({lazy: true});
// var jshint = require('gulp-jshint');
// var jscs = require('gulp-jscs');
// var stylish = require('gulp-jscs-stylish');
// var util = require('gulp-util');
// var gulpprint = require('gulp-print');
// var gulpif = require('gulp-if');

gulp.task('vet', function vettask () {
    log('Analysing source with JSHint & JSCS');
    return gulp
        .src(config.alljs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs())
        .pipe($.jscsStylish())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
        .pipe($.jshint.reporter('fail'));
});

function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.bgYellow(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.bgYellow(msg));
    }
}
