const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	target: 'node',
	mode: 'production',
	entry: {
		app: ['./start.js']
	},
	output: {
		path: path.resolve(__dirname),
		filename: 'start.min.js'
	},
	externals: [
		nodeExternals({
			modulesDir: path.resolve(__dirname, '..', '..', 'node_modules'),
			whitelist: [/^@cedalo/]
		})
	],
	optimization: {
		minimizer: [new TerserPlugin({
			terserOptions: {
				keep_classnames: true
			}
		})]
	}
};
