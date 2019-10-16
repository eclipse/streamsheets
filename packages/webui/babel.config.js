module.exports = (api) => {
	const presets = [
		'@babel/preset-env',
		'@babel/preset-react',
	];
	const plugins = [
		'@babel/plugin-proposal-class-properties',
		'@babel/plugin-transform-instanceof',
	];
	if (api.env('development')) {
		plugins.push(['react-intl', {
			messagesDir: './build/messages/',
		}]);
		plugins.push('@babel/plugin-proposal-object-rest-spread');
	}

	return {
		presets,
		plugins,
	};
};
