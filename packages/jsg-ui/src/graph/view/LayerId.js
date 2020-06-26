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
/**
 * This class contains predefined layer IDs used within the framework.</br>
 * For additional information about layer handling please refer to the corresponding methods in
 * {{#crossLink "GraphView"}}{{/crossLink}}.
 *
 * @class LayerId
 */
const LayerId = {
	/**
	 * A layer used for highlighting or indicating available ports.
	 *
	 * @property PORTS
	 * @type {String}
	 * @static
	 */
	PORTS: 'layer.ports',
	/**
	 * A layer used to display selections.
	 *
	 * @property SELECTION
	 * @type {String}
	 * @static
	 */
	SELECTION: 'layer.selection',
	/**
	 * A layer used to display snap lines.
	 *
	 * @property SNAPLINES
	 * @type {String}
	 * @static
	 */
	SNAPLINES: 'layer.snaplines',
	/**
	 * A layer used to display layout marker.
	 *
	 * @property LAYOUTMARKER
	 * @type {String}
	 * @static
	 */
	LAYOUTMARKER: 'layer.layoutmarker',
	/**
	 * A layer used to display the target container.
	 *
	 * @property TARGETCONTAINER
	 * @type {String}
	 * @static
	 */
	TARGETCONTAINER: 'layer.targetcontainer',
	/**
	 * A layer used to display a toolbar.
	 *
	 * @property TOOLBAR
	 * @type {String}
	 * @static
	 */
	TOOLBAR: 'layer.toolbar'
};

export default LayerId;
