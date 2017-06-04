module.exports = function() {
    var client = './src/client/';
    var clientApp = client + 'app/'
    var config = {
        autoprefixer: {
            browsers: [
                'last 2 version',
                '> 5%'
            ]
        },
        // file paths
        temp: './.temp/',
        // all js to vet
        alljs: [
            './src/**/*.js', 
            './*.js'
        ],
        less: [
            client+'styles/styles.less'
        ],
        index: client + 'index.html',
        js: [ 
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],
        client: client,

        bower: {
            json: require('./bower.json'),
            directory: './bower_components/',
            ignorePath: '../..'
        }
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