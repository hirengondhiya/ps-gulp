module.exports = function() {
    var client = './src/client/';
    var clientApp = client + 'app/';
    var report = './report/';
    var root = './';
    var server = './src/server/';
    var source = './src/';
    var temp = './.temp/';
    var wiredep = require('wiredep');
    var bowerFiles = wiredep({devDependencies: true})['js'];

    var config = {
        autoprefixer: {
            browsers: [
                'last 2 version',
                '> 5%'
            ]
        },
        // file paths
        // all js to vet
        alljs: [
            './src/**/*.js',
            './*.js'
        ],
        build: './build/',
        client: client,
        css: [
            temp + 'styles.css'
        ],
        fonts: 'bower_components/font-awesome/fonts/**/*.*',
        htmltemplates: clientApp + '**/*.html',
        images: client + 'images/**/*.*',
        index: client + 'index.html',
        js: [
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],
        less: [
            client + 'styles/styles.less'
        ],
        packages: [
            'package.json',
            'bower.json'
        ],
        report: report,
        root : root,
        server: server,
        temp: temp,

        // browser Sync
        reloadBrowserDelay: 1000,

        bower: {
            json: require('./bower.json'),
            directory: './bower_components/',
            ignorePath: '../..'
        },

        // template cahe
        templateCache: {
            file: 'templatecahe.js',
            options: {
                module: 'app.core',
                standAlone: false,
                root: 'app/'
            }
        },

        // Karma and testing settings
        specHelpers: [client + 'test-helpers/*.js'],
        serverIntegrationSpecs: [
            client + 'tests/server-integration/**/*.spec.js'
        ],

        // node settings
        defaultPort: 7203,
        nodeServer: server + 'app.js'
    };

    config.getDefaultWiredepOptions = function DefaultWiredepOptions() {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };
        return options;
    };

    config.karma = (function getKarmaOptions() {
        var options = {
            files: [].concat(
                bowerFiles,
                config.specHelpers,
                client + '**/*.module.js',
                client + '**/*.js',
                config.templateCache.file,
                config.serverIntegrationSpecs
            ),
            exclude: [],
            coverage: {
                dir: report + 'coverage',
                repoters: [
                    {type: 'html', subdir: 'report-html'},
                    {type: 'lcov', subdir: 'report-lcov'},
                    {type: 'text-summary'},
                ]
            },
            preprocessors: {}
        };
        options.preprocessors[clientApp + '**/!(*.spec)+(.js)'] = ['coverage'];
        return options;
    })();
    return config;
};
