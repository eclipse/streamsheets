module.exports = {
	// parser: '@typescript-eslint/parser', // Specifies the ESLint parser
	extends: [
		'@cedalo'
	],
	parserOptions: {
		ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
		sourceType: 'module' // Allows for the use of imports
	},
	env: {
		browser: true,
		node: true
	},
	rules: {
		// Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
		'global-require': 1,
		'no-undef': 1,
		'no-unused-vars': 1
	}
};
