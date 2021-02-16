/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the 
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
/* eslint-disable no-await-in-loop */
const fs = require('fs');
// const fs = require('fs').promises; still experimental :-(
const path = require('path');
const logger = require('@cedalo/logger').create({ name: 'commons/module' });

const promisify = (fn) => (...args) =>
	new Promise((resolve, reject) => {
		fn.call(fn, ...args, (err, res) => {
			if (err) reject(err);
			else resolve(res);
		});
	});

const onErrorReturn = (returnval) => (err) => {
	logger.info(err.message);
	return returnval;
};

const fileStats = promisify(fs.stat);
const fileExists = promisify(fs.access);
const readDir = promisify(fs.readdir);

const readDirFiles = (dir) =>
	readDir(dir)
		.then((files) => files)
		.catch(onErrorReturn([]));

const isDirectory = (file) =>
	fileStats(file)
		.then((stats) => stats.isDirectory())
		.catch(onErrorReturn(false));

const isModule = (file) =>
	fileExists(path.resolve(file, 'package.json'))
		.then(() => true)
		.catch(() => false);

const resolveFile = (file) => {
	try {
		return require.resolve(`${file}`);
	} catch (err) {
		logger.error(err.message);
	}
	return undefined;
};

const resolveModule = async (file) => {
	const isMod = await isModule(file);
	return isMod ? resolveFile(file) : undefined;
};

module.exports = {
	resolve: async (dir, { ignoreDirs = ['node_modules'] } = {}) => {
		const resolvedModules = [];
		const traverseAndResolve = async (moduleDir) => {
			const files = await readDirFiles(moduleDir).then((fls) => fls.filter((file) => !ignoreDirs.includes(file)));
			// eslint-disable-next-line
			for (const file of files) {
				const p = path.resolve(dir, file);
				const isDir = await isDirectory(p);
				if (isDir) {
					const resolved = await resolveModule(p, resolvedModules);
					if (resolved) resolvedModules.push(resolved);
					else await traverseAndResolve(p, resolvedModules);
				}
			}
		};
		await traverseAndResolve(path.resolve(dir));
		return resolvedModules;

	},
	resolveFile
};
