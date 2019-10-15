#!/usr/bin/env node

/* eslint-disable no-console */
const cp = require('child_process');
// const fs = require("fs");
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');
const argv = require('yargs').argv;

const toArray = (something) => (Array.isArray(something) ? something : [something]);

if (!argv.tag) {
	console.error('Missing tag');
	process.exit(1);
}
const tags = toArray(argv.tag);

const push = argv.push;

const baseImage = argv.image || '';

const derivative = argv.derivative;

const allServices = [
	'@cedalo/service-machines',
	'@cedalo/service-streams',
	'@cedalo/service-graphs',
	'@cedalo/gateway',
	'@cedalo/webui'
];

const imageNames = {
	'@cedalo/service-machines': 'streamsheets-service-machines',
	'@cedalo/service-streams': 'streamsheets-service-streams',
	'@cedalo/service-graphs': 'streamsheets-service-graphs',
	'@cedalo/gateway': 'streamsheets-gateway',
	'@cedalo/webui': 'streamsheets-webui'
};

let services = allServices;

if (argv.service) {
	services = toArray(argv.service);
	services.forEach((service) => {
		if (!allServices.includes(service)) {
			console.error(`Unknown service: ${service}`);
			process.exit(1);
		}
	});
}

if (services.length === 0) {
	console.log('No rebuild required');
	process.exit(1);
}

const baseImageArg = baseImage ? `--build-arg BASE_IMAGE=${baseImage}` : '';

try {
	// Copy package.json files to ./packagejsons preserving directory structure
	rimraf.sync('./packagejsons*');
	fs.mkdirSync('packagejsons');
	cp.execSync('tar cf packagejsons.tar packages/*/package.json packages/*/*/package.json');
	cp.execSync('tar xf packagejsons.tar -C packagejsons');
	cp.execSync(`docker build . -f scripts/Dockerfile.contextholder ${baseImageArg} -t contextholder`, {
		stdio: 'inherit'
	});
	rimraf.sync('./packagejsons*');
} catch (error) {
	console.error(error);
	process.exit(1);
}

services.forEach((service) => {
	console.log(`Building ${service}`);
	const nameTag = (tag) =>
		derivative ? `cedalo/${imageNames[service]}-${derivative}:${tag}` : `cedalo/${imageNames[service]}:${tag}`;

	const servicePath = cp
		.execSync(`node ./scripts/workspace-util.js loc ${service}`)
		.toString()
		.trim();
	try {
		const dockerfilePath = path.join(servicePath, 'Dockerfile');
		cp.execSync(
			`docker build ${servicePath} -f ${dockerfilePath} ${baseImageArg} ${tags
				.map((tag) => `-t ${nameTag(tag)}`)
				.join(' ')}`,
			{
				stdio: 'inherit'
			}
		);
	} catch (e) {
		process.exit(1);
	}
});

if (push) {
	services.forEach((service) => {
		const nameTag = (tag) =>
			derivative ? `cedalo/${imageNames[service]}-${derivative}:${tag}` : `cedalo/${imageNames[service]}:${tag}`;
		const images = tags.map((tag) => nameTag(tag));
		images.forEach((image) => {
			console.log(`Pushing image ${image}`);
			// return;
			cp.execSync(`docker push ${image}`, { stdio: 'inherit' });
		});
	});
}
