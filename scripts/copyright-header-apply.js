const fs = require('fs-extra');
const klaw = require('klaw');
const path = require('path');
const through2 = require('through2');

const INPUT = path.join(__dirname, '..', 'packages');
const COPYRIGHT_HEADER = fs.readFileSync(path.join(__dirname, 'copyright-header.txt')).toString();

const exclude = [
	'coverage',
	'node_modules', 
	'swagger'
]

const excludeDirFilter = through2.obj(function (item, enc, next) {
	if (
		exclude.every((directory) => !item.path.includes(directory))
		&& (item.stats.isDirectory()		// include directories
		|| item.path.endsWith('.js')		// include JavaScript files
		|| item.path.endsWith('.ts'))		// include TypeScript files
	) {
		this.push(item);
	}
	next();
});

const prepend = (filePath, content) => {
  const fileContent = fs.readFileSync(filePath).toString();
//   if (fileContent.indexOf(content) === 0) {
// 	fileContent = fileContent.substring(0, fileContent.length);
//   }
//   console.log(`${content}\n${fileContent}`);
  fs.writeFileSync(filePath, `${content}\n${fileContent}`);
//   console.log('written');
}

let counter = 0;

klaw(INPUT)
	.pipe(excludeDirFilter)
	.on('data', async (item) => {
		const filePath = item.path;
		if (item.stats.isFile()) {
			counter = counter + 1;
			console.log(`${counter} Adding copyright header to file: ${filePath}`);
			prepend(filePath, COPYRIGHT_HEADER);
		}
	})
	.on('end', () => {
		console.log('Finished');
	});
