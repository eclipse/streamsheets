#!/usr/bin/env node

/* eslint-disable no-console */
const cp = require('child_process');
const argv = require('yargs').argv;

const branch = argv.branch || 'master';

const workspaceInfo = JSON.parse(cp.execSync('yarn workspaces -s info'));
const workspaceInfoEntries = Object.entries(workspaceInfo);

workspaceInfoEntries.forEach(([name, { location }]) => {
	const result = cp
		.execSync(`git diff --name-only ${branch} ${location}`)
		.toString()
		.trim();

	if (result) {
		console.log(name);
	}
});
