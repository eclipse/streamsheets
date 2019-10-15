const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/index.js', // <-- its webpack default ;-)
	devServer: {
		port: 3010,
		contentBase: path.join(__dirname, 'dist')
	},
	// source map generation:
	devtool: 'cheap-module-source-map', // eval-cheap-module-source-map
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader'
				}
			},
			{
				test: /Worker\.js$/,
				use: {
					loader: 'worker-loader'
				}
			},
			{
				test: /\.html$/,
				use: [
					{
						loader: 'html-loader'
					}
				]
			}
			// ,
			// {
			// 	test: /\.css$/,
			// 	use: ["style-loader", "css-loader"]
			// }

			// {
			// 	test: /\.css$/,
			// 	use: [
			// 	  {
			// 		loader: "style-loader"
			// 	  },
			// 	  {
			// 		loader: "css-loader",
			// 		options: {
			// 		  modules: true,
			// 		  importLoaders: 1,
			// 		  localIdentName: "[name]_[local]_[hash:base64]",
			// 		  sourceMap: true,
			// 		  minimize: true
			// 		}
			// 	  }
			// 	]
			// }
		]
	},
	plugins: [
		new HtmlWebPackPlugin({
			template: './src/index.html',
			filename: './index.html'
		})
	]
};
