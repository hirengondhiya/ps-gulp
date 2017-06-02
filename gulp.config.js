module.exports = function() {
    var client = './src/client/'
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
        ]
    };
    return config;
}