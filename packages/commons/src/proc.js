// script which is executed...
// const path = require('path');
// const getScript = () => path.relative(process.cwd(), process.argv[1]);

const getScriptArgs = () => process.argv ? ` ${process.argv.slice(2).join(' ')}` : '';
const getProcessArgs = () => process.execArgv ? ` ${process.execArgv.join(' ')}` : '';

const setProcessTitle = (title, includeArgs = true) => {
	title = title || process.argv[0];
	process.title = includeArgs ? `Cedalo/${title}${getProcessArgs()}${getScriptArgs()}` : `${title}`;
};

module.exports = {
	setProcessTitle
};
