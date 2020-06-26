#!/usr/bin/env node

const cp = require('child_process');
const argv = require('yargs').argv;

const fromImageTag = argv.fromImageTag || 'latest';

const fromImage = `cedalo/streamsheets:${fromImageTag}`;
const toImage = `cedalo/streamsheets:latest`;

try {
	console.log(`Pulling image ${fromImage}`);
	cp.execSync(`docker pull ${fromImage}`, { stdio: 'inherit' });
	console.log(`Tagging image ${toImage}`);
	cp.execSync(`docker tag ${fromImage} ${toImage}`, { stdio: 'inherit' });
	console.log(`Pushing image ${toImage}`);
	cp.execSync(`docker push ${toImage}`, { stdio: 'inherit' });
} catch (error) {
	process.exit(1);
}
