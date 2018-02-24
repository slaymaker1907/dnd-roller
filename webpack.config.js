const path = require("path");
const webpack = require("webpack");

module.exports = {
    entry: {
        bundle: "./src/index.tsx"
    },

    output: {
        filename: "[name].js",
        path: __dirname + "/build"
    },

    devtool: "source-map",
    devServer: {
        port: 8000,
        publicPath: "/build"
    },

    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "awesome-typescript-loader",
                include: [path.resolve(__dirname, "src")]
            },
            {
                test: /\.scss$/,
                use: [
                    {
                        loader: "style-loader",
                    },
                    {
                        loader: "css-loader"
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            includePaths: ["node_modules"]
                        }
                    }
                ],
                include: path.resolve(__dirname, "style")
            },
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader",
                include: path.resolve(__dirname, "src")
            }
        ]
    }
};
