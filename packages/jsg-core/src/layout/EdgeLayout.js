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
const Layout = require('./Layout');
const Line = require('./Line');
const Settings = require('./Settings');

const DIST_TO_PORT = 'jsg.layout.edge.dist.to.port';
const settings = new Settings();
settings.set(DIST_TO_PORT, 0); // 250);

/**
 * A basic layout for simple {{#crossLink "Edge"}}{{/crossLink}}s. For orthogonal edges please refer to
 * {{#crossLink "OrthogonalLayout"}}{{/crossLink}}.
 * @class EdgeLayout
 * @extends Layout
 * @constructor
 * @since 2.0.7
 */
class EdgeLayout extends Layout {
	getType() {
		return EdgeLayout.TYPE;
	}

	getInitialSettings(graphitem) {
		return EdgeLayout.Settings.derive();
	}

	layout(graphitem) {
		if (this.isEnabled(graphitem)) {
			const shape = graphitem.getShape();
			const setting = this.getSettings(graphitem);
			if (this._doLayout(graphitem, setting)) {
				// refresh shape to set new shape points...
				shape.refresh();
				return true;
			}
		}
		return false;
	}

	_doLayout(edge, setting) {
		let layouted = false;
		const DISTANCE_TO_PORT = setting.get(EdgeLayout.DIST_TO_PORT, 0);
		if (DISTANCE_TO_PORT > 0) {
			const line = Line.initWithEdge(edge, setting);
			if (edge.hasSourceAttached()) {
				layouted = line.checkPortDistance(edge.getSourcePort(), DISTANCE_TO_PORT);
			}
			if (edge.hasTargetAttached()) {
				layouted = line.checkPortDistance(edge.getTargetPort(), DISTANCE_TO_PORT) || layouted;
			}
		}
		return layouted;
	}

	/**
	 * The unique layout type.
	 *
	 * @property TYPE
	 * @type {String}
	 * @static
	 */
	static get TYPE() {
		return 'jsg.layout.edge';
	}

	/**
	 * Constant for the distance setting which determines the distance of the connection point to the actual attached port.
	 * @property DIST_TO_PORT
	 * @type {String}
	 * @static
	 */
	// if <= 0 then end points are equal to port location!
	static get DIST_TO_PORT() {
		return DIST_TO_PORT;
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

module.exports = EdgeLayout;
