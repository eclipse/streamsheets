#!/usr/bin/env node

/* eslint-disable no-console */
const cp = require('child_process');
const fs = require('fs');
const path = require('path');

const command = process.argv[2];
const targetPackage = process.argv[3];

if (!command || !targetPackage) {
	console.error('Missing args: command targetPackage');
	process.exit(1);
}

const workspaceInfo = JSON.parse(cp.execSync('yarn workspaces -s info'));

if (!workspaceInfo[targetPackage]) {
	console.error('Invalid targetPackage', targetPackage);
	process.exit(1);
}

const isProdDependency = (pkg, parent) => {
	if (!parent.location) return true;
	const childPackageJson = JSON.parse(fs.readFileSync(path.join(parent.location, 'package.json')));
	return !!childPackageJson.dependencies[pkg];
};

const resolveDeps = (pkg, info, parent) =>
	isProdDependency(pkg, parent)
		? [].concat(pkg, ...info[pkg].workspaceDependencies.map((pkg2) => resolveDeps(pkg2, info, info[pkg])))
		: [];

const getDeps = (pkg) => Array.from(new Set(resolveDeps(pkg, workspaceInfo, {})));
const getLocation = (pkg) => workspaceInfo[pkg].location;
// const getLocations = pkg => getDeps(pkg).map(getLocation);

const prune = (pkg) => {
	const pkgDeps = getDeps(pkg);
	const toRemove = new Set(Object.keys(workspaceInfo));
	pkgDeps.forEach((dep) => toRemove.delete(dep));
	const removeLocs = Array.from(toRemove).map(getLocation);
	if (removeLocs.length > 0) {
		cp.execSync(`rm -rf ${Array.from(removeLocs).join(' ')}`);
	}
};

const deps = (pkg) => getDeps(pkg).forEach((dep) => console.log(dep));
const loc = (pkg) => console.log(getLocation(pkg));

const commands = {
	prune,
	deps,
	loc
};

const commandFunction = commands[command];

if (!commandFunction) {
	console.error('Invalid command');
	process.exit(1);
}

commandFunction(targetPackage);
