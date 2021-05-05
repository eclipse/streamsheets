const { dockerCommand } = require('docker-cli-js');

const myArgs = process.argv.slice(2);
const cmdStart = 'run -dp 15672:15672 -p 5672:5672 --name stream-rabbitmq  stream-rabbitmq';
const cmdStop = 'stop stream-rabbitmq';
const cmdRemove = 'rm stream-rabbitmq';
const cmdBuild = 'build -t stream-rabbitmq .';

const options = {
	machineName: null, // uses local docker
	currentWorkingDirectory: __dirname, // uses current working directory
	echo: true, // echo command output to stdout/stderr
};

const start = async () => {
	try {
		const data = await dockerCommand(cmdStop, options);
		const data1 = await dockerCommand(cmdRemove, options);
	} catch (e) {
		console.warn(e.message);
	}
	try {
		const data2 = await dockerCommand(cmdBuild, options);
		const data3 = await dockerCommand(cmdStart, options);
	} catch (e) {
		console.error(e);
	}
}

const stop = async () => {
	try {
		const data = await dockerCommand(cmdStop, options);
	} catch (e) {
		console.warn(e.message);
	}
	try {
		const data1 = await dockerCommand(cmdRemove, options);
	} catch (e) {
		console.error(e.message);
	}
}

switch (myArgs[0]) {
	case 'start':
		console.log('starting rabbitmq');
		start().catch(e => console.error(e));
		break;
	case 'stop':
		console.log('stopping rabbitmq');
		stop().catch(e => console.error(e));
		break;
	default:
		console.log('arg missing');
}

module.exports = {
	start,
	stop,
}
