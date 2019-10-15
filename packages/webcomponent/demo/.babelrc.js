module.exports = {
	// presets: ['@babel/preset-env']
	// problems with es5 classes extending es6
	presets: [
		[
			'@babel/preset-env',
			{
				modules: false,
				targets: {
					chrome: 69
				}
			}
		]
	]
};
