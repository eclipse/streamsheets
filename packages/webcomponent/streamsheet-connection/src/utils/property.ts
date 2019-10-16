// const get = (obj, ...path) => path.reduce((parent, part) => (parent != null ? parent[part] : parent), obj);

// const getOrDefault = (obj, def, ...path) => {
// 	const prop = get(obj, ...path);
// 	return prop != null ? prop : def;
// };

const get = (...path: string[]) => (obj: any, def: any) => {
	const prop = path.reduce((parent, part) => (parent != null ? parent[part] : parent), obj);
	return prop != null ? prop : def;
};

export default { get, /* getOrDefault */ };