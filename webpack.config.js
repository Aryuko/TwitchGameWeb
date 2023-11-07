const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

let config = {
    entry: {
        react: path.resolve('./src/frontend/Index.jsx')
    },
    output: {
        path: path.resolve('./public'),
        filename: '[name]-bundle.js'
    },
    module: {
        rules: [
            {
                exclude: /node_modules/,
                test: /.((js)|jsx)?$/,
                use: 'babel-loader'
            },
            {
                exclude: /node_modules/,
                test: /\.json$/,
                use: 'json-loader'
            },
            {
                include: path.resolve(__dirname, 'node_modules/pixi.js'),
                use: 'ify-loader'
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: path.resolve(__dirname, "src/frontend/assets"), to: path.resolve(__dirname, "public/assets") },
                // { from: "other", to: "public" },
            ],
        }),
    ]
}

module.exports = config

