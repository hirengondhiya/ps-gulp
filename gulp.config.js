module.exports = function() {
    var source = './src/';
    var client = './src/client/';
    var clientApp = client + 'app/';
    var temp = './.temp/';
    var server = './src/server/';

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
            client+'styles/styles.less'
        ],
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
    }
    return config;
}