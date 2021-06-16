// script which is executed...
// const path = require('path');
// const getScript = () => path.relative(process.cwd(), process.argv[1]);

const collect = (arr, start = 0) => {
	const args = [];
	for (let i = start; i < arr.length; i += 1) args.push(arr[i]);
	return args.join(' ');
};
const getScriptArgs = () => collect(process.argv, 2);
const getProcessArgs = () => collect(process.execArgv);

const setProcessTitle = (title, includeArgs = true) => {
	title = title || process.args[0];
	process.title = includeArgs ? `${title} ${getProcessArgs()} ${getScriptArgs()}` : `${title}`;
};

module.exports = {
	setProcessTitle
};
