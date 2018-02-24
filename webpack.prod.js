const Merge = require("webpack-merge");
const webpack = require("webpack");
const config = require("./webpack.config.js");
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = Merge(config, {
    devtool: "source-map",
    plugins: [
        new webpack.LoaderOptionsPlugin({
            minimize: true,
            debug: false
        }),
        new webpack.EnvironmentPlugin({
            NODE_ENV: "production"
        }),
        new UglifyJSPlugin({
            cache: true,
            parallel: true,
            sourceMap: true,
            uglifyOptions: {
                mangle: true,
                output: {
                    comments: false,
                    beautify: false,
                    ecma: 6,
                    semicolons: false,
                }
            }
        }),
    ],
});
