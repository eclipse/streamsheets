const webpack = require('webpack');
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const path = require('path');
const env = require('yargs').argv.env;

let libraryName = '@cedalo/gateway-client-proxy';
let outputFile = '';

let plugins = [];

if (env === 'build') {
  plugins.push(new UglifyJsPlugin({ minimize: true }));
  outputFile = libraryName + '.min.js';
} else {
  outputFile = libraryName + '.js';
}

const config = {
	entry: [__dirname + '/index.js'],
	devtool: 'source-map',
	output: {
		path: __dirname + '/dist',
		filename: outputFile,
		library: libraryName,
		libraryTarget: 'umd',
		umdNamedDefine: true
	},
	module: {
		rules: [
      {
				test: /Worker\.js$/,
				use: {
          loader: 'worker-loader'
        }
			},
			{
				test: /(\.jsx|\.js)$/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				},
				exclude: /(node_modules|bower_components)/,
				include: [
					path.join(
						__dirname,
						'node_modules',
						'@cedalo/gateway-client'
					)
				]
      }
		]
	},
	resolve: {
		modules: [path.resolve('./node_modules'), path.resolve('../../node_modules'), path.resolve('./src')],
		extensions: ['.json', '.js'],
		// alias: {
		// 	'@cedalo/gateway-client': path.resolve('../../node_modules/@cedalo/gateway-client')
		// }
  },
	plugins: plugins,
	devServer: {
		contentBase: path.join(__dirname, 'dist'),
		hot: true,
		port: 3002,
		inline: true
	}
};

module.exports = config;
