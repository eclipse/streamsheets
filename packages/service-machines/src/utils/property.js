const get = (...path) => (obj, def) => {
	const prop = path.reduce((parent, part) => (parent != null ? parent[part] : parent), obj);
	return prop != null ? prop : def;
};

module.exports = { get };