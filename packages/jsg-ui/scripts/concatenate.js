'use strict';
const path = require('path');
const concat = require('concat');

concat(
	[
		path.join(__dirname, '..', 'src', 'ui', 'events', 'hammer.js'),
		path.join(__dirname, '..', 'dist', 'jsg-3.0.0.nolibs.js')
	],
	path.join(__dirname, '..', 'dist', 'jsg-3.0.0.js')
);
