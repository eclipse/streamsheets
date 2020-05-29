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
import { FormatAttributes } from '@cedalo/jsg-core';
import SelectionStyle from './SelectionStyle';

/**
 * Predefined {{#crossLink "SelectionHandlerFactory"}}{{/crossLink}} objects used to display various
 * markers on selection and during interaction.
 *
 * @class Styles
 * @since 2.0.20.2
 */
const Styles = (() => {
	const portmarker = new SelectionStyle();
	portmarker.markerFillColor = '#AA1446';

	const newmarker = new SelectionStyle();
	newmarker.markerFillColor = 'green';

	const marker = new SelectionStyle();

	const readonly = new SelectionStyle();
	readonly.areMarkersVisible = false;
	readonly.isRotateMarkerVisible = false;
	readonly.lineWidth = 100;
	readonly.lineColor = '#ff7f27';
	readonly.lineStyle = FormatAttributes.LineStyle.SOLID;

	return {
		/**
		 * Default style for a general marker.
		 * @property MARKER
		 * @type {SelectionStyle}
		 */
		MARKER: marker,
		/**
		 * Default style for a marker which visualizes the location to insert a new point.
		 * @property ADD_POINT_MARKER
		 * @type {SelectionStyle}
		 */
		ADD_POINT_MARKER: newmarker,
		/**
		 * Default style for a marker which visualizes a port location.
		 * @property PORT_MARKER
		 * @type {SelectionStyle}
		 */
		PORT_MARKER: portmarker,
		/**
		 * Default selection style for read-only mode.
		 * @property READ_ONLY
		 * @type {SelectionHandlerFactory}
		 */
		READ_ONLY: readonly
	};
})();

export default Styles;
