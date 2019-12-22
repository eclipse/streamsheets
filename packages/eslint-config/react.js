module.exports = {
	extends: [
		'eslint-config-airbnb',
		'eslint-config-airbnb/hooks',
		'eslint-config-prettier',
		'eslint-config-prettier/react'
	].map(require.resolve),
	parser: 'babel-eslint',
	rules: {
		'no-tabs': 0,
		'no-undef': 0,
		'react/jsx-no-undef': 1,
		'import/no-named-default': 1,
		'import/no-named-as-default': 1,
		'import/no-named-as-default-member': 1,
		'no-underscore-dangle': 0,
		'class-methods-use-this': 0,
		'no-param-reassign': 0,
		'jsx-a11y/no-static-element-interactions': 1,
		'react/jsx-filename-extension': [
			1,
			{
				extensions: ['.js', '.jsx']
			}
		],
		// TODO: Fix the following
		'lines-between-class-members': 0,
		'prefer-destructuring': 0,
		'max-classes-per-file': 0,
		'import/order': 0,
		'comma-dangle': 0,
		'no-restricted-globals': 0,
		indent: 0,
		'prefer-object-spread': 0,
		'react/destructuring-assignment': 0,
		'no-else-return': 0,
		'react-hooks/exhaustive-deps': 1,
		'react/static-property-placement': 1,
		'react/jsx-fragments': 1,
		'react/forbid-prop-types': 1,
		'react/no-access-state-in-setstate': 1,
		'react/jsx-props-no-spreading': 1,
		'react/sort-comp': 1,
		'react/prop-types': 1,
		'no-async-promise-executor': 1,
		'react/state-in-constructor': 1,
		'import/no-useless-path-segments': 1,
		'import/no-cycle': 1,
		'no-useless-catch': 1,
		'jsx-a11y/control-has-associated-label': 1
	},
	parserOptions: {
		ecmaFeatures: {
			experimentalObjectRestSpread: true
		}
	}
};
