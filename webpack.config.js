var ExtractTextPlugin = require('extract-text-webpack-plugin'),
    extractSass = new ExtractTextPlugin({
        filename: './docs/heirsoft.css'
    });

var js = {
    entry: ['./index'],
    output: { filename: './docs/heirsoft.js' },
    module: {
        loaders: [
            { test: /\.json$/, loader: 'json-loader' },
            { test: /\.html$/, loader: 'html-loader?minimize=false' },
            { test: /\.png$/,  loader: 'url-loader?mimetype=image/png' },
            { test: /\.jpeg$/, loader: 'url-loader?mimetype=image/jpeg' },
        ],
    }
};

var css = {
    entry: ['./index.css'],
    output: { filename: './docs/heirsoft.css' },
    module: {
        rules: [{
            test: /\.scss|\.css$/,
            use: extractSass.extract({
                use: [{
                    loader: 'css-loader'
                }, {
                    loader: 'sass-loader'
                }],
                fallback: 'style-loader'
            })
        }]
    },
    plugins: [
        extractSass
    ]
};

module.exports = [js, css];
