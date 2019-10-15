let loadedRegistries;
const jsgRegistries = [
	'./graph/attr/AttributeRegistry',
	'./graph/expr/ConstraintRegistry',
	'./graph/expr/ExpressionRegistry',
	'./layout/SettingsRegistry'
];
const customObjects = {};
const customRegistry = {
	get(name) {
		return customObjects[name];
	}
};

const ensureRegistriesLoaded = () => {
	if (!loadedRegistries) {
		// eslint-disable-next-line
		loadedRegistries = jsgRegistries.map((path) => require(`${path}`));
		loadedRegistries.unshift(customRegistry);
	}
};

const get = (name) => {
	ensureRegistriesLoaded();
	return loadedRegistries.reduce((obj, reg) => obj || reg.get(name), undefined);
};

module.exports = {
	create(name /* ...params */) {
		const Clazz = get(name);
		return Clazz ? new Clazz(/* ...params */) : undefined;
	},
	has(name) {
		return !!get(name);
	},
	register(name, clazz) {
		if (name != null) customObjects[name] = clazz;
	}
};
