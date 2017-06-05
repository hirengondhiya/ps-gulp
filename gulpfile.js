var gulp = require('gulp');
var args = require('yargs').argv;
var config = require('./gulp.config')();
var del = require('del');
var browserSync = require('browser-sync');
var $ = require('gulp-load-plugins')({lazy: true});
var port = process.env.PORT || config.defaultPort;

// var jshint = require('gulp-jshint');
// var jscs = require('gulp-jscs');
// var stylish = require('gulp-jscs-stylish');
// var util = require('gulp-util');
// var gulpprint = require('gulp-print');
// var gulpif = require('gulp-if');

log('Starting gulp tasks');

gulp.task('help', $.taskListing);

gulp.task('default', ['help']);

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
});

gulp.task('clean-styles', function cleanStylesTask(done) {
    var files = config.temp + '**/*.css';
    clean(files, done);
});

function clean(path, done) {
    log('Cleaning: '+$.util.colors.blue(path));
    del(path).then(done());
}


gulp.task('style-watcher', function styleWatcherTask() {
    gulp.watch(config.less, ['styles']);
});

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
});

gulp.task('inject',['wiredep', 'styles'], function injectTask() {
    // created seperate task because it is not efficient to always compile custom css on bower install
    log('Calling wiredep and injecting custom css styles');

    return gulp
        .src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});

gulp.task('serve-dev', ['inject'], function serveDevTask() {
    log('Serving dev build');
    
    var isDev = true;
    var nodeOptions = {
        script: config.nodeServer, // path to app.js file
        delayTime: 1,
        env: {
            'PORT': port, 
            'NODE_ENV': isDev? 'dev' : 'build'
        },
        watch: [config.server] // the files to restart on
    }

    return $.nodemon(nodeOptions)
        .on('start', function onNodemonStart() {
            log('Nodemon started ');
            startBrowserSync();
        })
        // we can also add dependency on gulp tasks to run before restart for ex vet as follows
        // .on('restart', ['vet'], function onNodemonRestart(evt) {
        .on('restart', function onNodemonRestart(evt) {
            log('Nodemon restarted on file changes: ' + evt);

            //settimeout to make sure browser reloads only after nodemon finishes loading server files
            setTimeout(function reloadBrowser() { 
                browserSync.notify('reloading now...');
                browserSync.reload({stream: false})
            }, config.reloadBrowserDelay)
        })
        .on('crash', function onNodemonCrash() {
            log('Nodemon crshed due to some error.');
        })
        .on('exit', function onNodemonExit(evt) {
            log('Nodemon exit cleanly.');
        });
});

function changeEvent(event) {
    var scrPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log($.util.colors.bgRed('File ' + event.path.replace(scrPattern, '') + ' ' + event.type));
}

function startBrowserSync() {
    if(browserSync.active || args.nosync) {
        return
    }
    log('Starting Browser Sync on Port: ' + port);

    gulp.watch(config.less, ['styles'])
        .on('change', function onStyleChange(event) { changeEvent(event); }) ;

    var browserSyncOptions = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: [
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true, // inject only files which are changed
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true, // notify in browser after sync completed
        reloadDelay: 1000
    };

    browserSync(browserSyncOptions);
}

gulp.task('fonts', function fontsTask() {
    log('Copying fonts to build folder.')

    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', function imagesTask() {
    log('Compressing & copying images to build folder.')

    return gulp
        .src(config.images)
        .pipe($.imagemin({optimizationLevel: 4}))
        .pipe(gulp.dest(config.build + 'images'));
});

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
