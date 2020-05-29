const fs = require('fs-extra');
const klaw = require('klaw');
const path = require('path');
const through2 = require('through2');

const INPUT = path.join(__dirname, '..', 'packages');
const COPYRIGHT_HEADER = fs.readFileSync(path.join(__dirname, 'copyright-header.txt')).toString();

const excludeDirectories = ['node_modules', 'coverage', 'swagger']

const excludeDirFilter = through2.obj(function (item, enc, next) {
	if (
		excludeDirectories.every((directory) => !item.path.includes(directory))
		&& (item.stats.isDirectory()		// include directories
		|| item.path.endsWith('.js'))		// include JavaScript files
	) {
		this.push(item);
	}
	next();
});

const prepend = async (filePath, content) => {
  const fileContent = fs.readFileSync(filePath).toString();
  console.log(`${content}\n${fileContent}`);
  await fs.writeFile(filePath, `${content}\n${fileContent}`);
  console.log('written');
}

klaw(INPUT)
	.pipe(excludeDirFilter)
	.on('data', (item) => {
		const filePath = item.path;
		if (item.stats.isFile()) {
			console.log(`Adding copyright header to file: ${filePath}`);
		}
	});
