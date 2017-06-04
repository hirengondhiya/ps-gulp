var gulp = require('gulp');
var args = require('yargs').argv;
var config = require('./gulp.config')();
var del = require('del');
var $ = require('gulp-load-plugins')({lazy: true});
// var jshint = require('gulp-jshint');
// var jscs = require('gulp-jscs');
// var stylish = require('gulp-jscs-stylish');
// var util = require('gulp-util');
// var gulpprint = require('gulp-print');
// var gulpif = require('gulp-if');

log('Starting gulp tasks');

gulp.task('vet', function vetTask () {
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

gulp.task('styles', ['clean-styles'], function stylesTask() {
    log('Compiling LESS to CSS');

    return gulp
        .src(config.less)
        .pipe($.plumber())
        .pipe($.less())
        // .on('error', errorLogger)
        .pipe($.autoprefixer(config.autoprefixer))
        .pipe(gulp.dest(config.temp));
})

gulp.task('clean-styles', function cleanStylesTask(done) {
    var files = config.temp + '**/*.css';
    clean(files, done);
})

function clean(path, done) {
    log('Cleaning: '+$.util.colors.blue(path));
    del(path).then(done());
}


gulp.task('style-watcher', function styleWatcherTask() {
    gulp.watch(config.less, ['styles']);
})

gulp.task('wiredep', function wiredepTask() {
    // this task will be called every time a bower component is installed
    log('Wiring up bower javascript and css files & injecting custom javascript files from app')
    var options = config.getDefaultWiredepOptions();
    var wiredep = require('wiredep').stream;
    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
})

gulp.task('inject',['wiredep', 'styles'], function injectTask() {
    // created seperate task because it is not efficient to always compile custom css on bower install
    log('Calling wiredep and injecting custom css styles');

    return gulp
        .src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
})

// function errorLogger(error) {
//     log('### Start of Error');
//     log(error);
//     log('End of Error.###');
//     this.emit('end');
// }

function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.bgYellow(msg[item]));
            }
        }
    } else {
        if(msg === 'Starting gulp tasks') {
            $.util.log($.util.colors.bgCyan(msg));
        } else {
            $.util.log($.util.colors.bgYellow(msg));
        }
        
    }
}
