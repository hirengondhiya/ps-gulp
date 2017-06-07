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

gulp.task('clean-fonts', function cleanFontsTask(done) {
    var files = config.build + 'fonts/**/*.*';
    clean(files, done);
});

gulp.task('clean-images', function cleanImagesTask(done) {
    var files = config.build + 'images/**/*.images';
    clean(files, done);
});

gulp.task('clean-code', function cleanCodeTask(done) {
    var files = [].concat(
        config.build + 'js/**/*.js',
        config.build + '**/*.html',
        config.temp + '**/*.js'
    );
    clean(files, done);
});

gulp.task('clean', function cleanTask(done) {
    var delconfig = [].concat(config.build, config.temp);
    clean(delconfig, done);
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

gulp.task('inject',['wiredep', 'styles', 'templatecache'], function injectTask() {
    // created seperate task because it is not efficient to always compile custom css on bower install
    log('Calling wiredep and injecting custom css styles');

    return gulp
        .src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});

gulp.task('optimize', ['inject', 'fonts', 'images'], function optimizeTask() {
    var templatecachefile = config.temp + config.templateCache.file;

    return gulp.src(config.index)
        .pipe($.plumber())
        .pipe($.inject(gulp.src(templatecachefile, {read: false}), { 
            starttag: '<!--inject:templates-->'
        }))
        .pipe($.useref({searchPath: './'}))
        .pipe($.if('*.css', $.csso()))
        .pipe($.if('*.js', $.uglify()))
        .pipe(gulp.dest(config.build));
});

gulp.task('serve-dev', ['inject'], function serveDevTask() {
    log('Serving dev build');
    serve(true);
});

gulp.task('serve-build', ['optimize'], function serveProdTask() {
    log('Serving prod build');
    serve(false);
});

function serve(isDev) {
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
            startBrowserSync(isDev);
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

}

gulp.task('templatecache', ['clean-code'], function templatecacheTask() {
    return gulp.src(config.htmltemplates)
        .pipe($.minifyHtml({empty: true}))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.temp));
})

function changeEvent(event) {
    var scrPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log($.util.colors.bgRed('File ' + event.path.replace(scrPattern, '') + ' ' + event.type));
}

function startBrowserSync(isDev) {
    if(browserSync.active || args.nosync) {
        return
    }
    log('Starting Browser Sync on Port: ' + port);

    if(isDev) {
        gulp.watch(config.less, ['styles'])
            .on('change', function onStyleChange(event) { changeEvent(event); }) ;
    } else {
        gulp.watch([config.less, config.js, config.htmltemplates] , ['optimize', browserSync.reload])
            .on('change', function onStyleChange(event) { changeEvent(event); }) ;
    }
    var browserSyncOptions = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: isDev ? [ 
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ] : [],
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
