const Layout = require('./Layout');
const Settings = require('./Settings');

const settings = new Settings();

class GraphLayout extends Layout {
	getType() {
		return GraphLayout.TYPE;
	}

	getInitialSettings(graphitem) {
		return GraphLayout.Settings.derive();
	}

	register(graphitem) {
		const instance = super.register(graphitem);
		return instance;
	}

	unregister(graphitem) {
		super.unregister(graphitem);
	}

	layout(graphitem, forceNodeLayout) {}

	static get TYPE() {
		return 'jsg.graph.layout';
	}

	/**
	 * A general settings object which defines the default layout preferences.
	 * @property Settings
	 * @type {Settings}
	 * @static
	 */
	static get Settings() {
		return settings;
	}
}

module.exports = GraphLayout;
