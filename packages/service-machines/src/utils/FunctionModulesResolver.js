const fs = require('fs');
// const fs = require('fs').promises; still experimental :-(
const path = require('path');
const config = require('../../config/config');
const logger = require('./logger').create({ name: 'FunctionModulesResolver' });

const IGNORE_DIRS = config.functions.ignore_dirs;
const FN_MODULES_DIR = config.functions.module_dir;
const CORE_FUNCTIONS = '@cedalo/functions';

const RESOLVED_MODULES = [];

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
const readDirFiles = (dir) => readDir(dir).then((files) => files).catch(onErrorReturn([]));
const isDirectory = (file) => fileStats(file).then((stats) => stats.isDirectory()).catch(onErrorReturn(false));
const isModule = (file) => fileExists(path.resolve(file, 'package.json')).then(() => true).catch(() => false);

const resolveFile = (file) => {
	try {
		return require.resolve(file);
	} catch (err) {
		logger.error(err.message);
	}
	return undefined;
};
const resolveModule = async (file) => {
	const isMod = await isModule(file);
	return isMod ? resolveFile(file) : undefined;
};

const resolve = async (dir, resolvedModules) => {
	const files = await readDirFiles(dir).then((fls) => fls.filter((file) => !IGNORE_DIRS.includes(file)));
	return files.reduce(async (prev, file) => {
		const res = await prev;
		const p = path.resolve(dir, file);
		const isDir = await isDirectory(p);
		if (isDir) {
			const resolved = await resolveModule(p, res);
			if (resolved) res.push(resolved);
			else await resolve(p, resolvedModules);
		}
		return res;
	}, resolvedModules);
};
const traverse = async (dir) => {
	RESOLVED_MODULES.length = 0;
	const corefn = resolveFile(CORE_FUNCTIONS);
	if (corefn) RESOLVED_MODULES.push(corefn);
	return resolve(path.resolve(dir), Promise.resolve(RESOLVED_MODULES));
};

module.exports = {
	resolve: async () => traverse(FN_MODULES_DIR),
	getModules: () => RESOLVED_MODULES
};
