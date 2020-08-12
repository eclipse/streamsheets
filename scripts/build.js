#!/usr/bin/env node

/* eslint-disable no-console */
const cp = require('child_process');
const path = require('path');
const argv = require('yargs').option('tag', {
	string: true
}).argv;

const toArray = (something) => (Array.isArray(something) ? something : [something]);

if (!argv.tag) {
	console.error('Missing tag');
	process.exit(1);
}

if (!argv.name) {
	console.error('Missing name');
	process.exit(1);
}

const tags = toArray(argv.tag);

const push = argv.push;

const baseImage = argv.image || '';

const imageName = argv.name;

const dockerFileName = argv.dockerfile || 'Dockerfile';

const skipFrontendBuild = argv.skipFrontend;

const skipGatewayBuild = argv.skipGateway;

const baseImageArg = baseImage ? `--build-arg BASE_IMAGE=${baseImage}` : '';

const buildTaggedImageArg = (tag) => `${imageName}:${tag}`;

const dockerFilePath = path.join('deployment', 'single', dockerFileName);

const taggedImageArgs = tags.map((tag) => `-t ${buildTaggedImageArg(tag)}`);

try {
	if (skipFrontendBuild) {
		console.log('Skipping frontend build');
	} else {
		console.log(`Building frontend`);
		cp.execSync('yarn workspace @cedalo/webui local-build', {
			stdio: 'inherit',
		});
	}

	if (skipGatewayBuild) {
		console.log('Skipping gateway build');
	} else {
		console.log(`Building gateway`);
		cp.execSync('yarn workspace @cedalo/gateway build', {
			stdio: 'inherit',
		});
	}

	console.log(`Building ${imageName}`);
	cp.execSync(`docker build . -f ${dockerFilePath} ${baseImageArg} ${taggedImageArgs.join(' ')}`, {
		stdio: 'inherit'
	});

	if (push) {
		tags.map(buildTaggedImageArg).forEach((image) => {
			console.log(`Pushing image ${image}`);
			cp.execSync(`docker push ${image}`, { stdio: 'inherit' });
		});
	}
} catch (error) {
	console.error(error);
	process.exit(1);
}
