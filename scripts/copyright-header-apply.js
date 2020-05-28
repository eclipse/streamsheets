const fs = require('fs-extra');
const klaw = require('klaw');
const path = require('path');
const through2 = require('through2');

const INPUT = path.join(__dirname, '..', 'packages');

const excludeDirFilter = through2.obj(function(item, enc, next) {
	if (
		!item.path.includes('node_modules') // exclude node_modules
		&& !item.path.includes('coverage') 	// exclude coverage
		&& (item.stats.isDirectory()		// include directories
		|| item.path.endsWith('.js'))		// include JavaScript files
	) {
		this.push(item);
	}
	next();
});

klaw(INPUT)
	.pipe(excludeDirFilter)
	.on('data', (item) => {
		const filePath = item.path;
		if (item.stats.isFile()) {
			console.log(filePath);
		}
	});
