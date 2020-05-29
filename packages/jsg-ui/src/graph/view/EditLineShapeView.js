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
import { default as JSG } from '@cedalo/jsg-core';
import EditShapeView from './EditShapeView';

/**
 * This subclass of EditShapeView should be used to edit {{#crossLink "LineShape"}}{{/crossLink}}
 * instances.
 *
 * @class EditLineShapeView
 * @extends EditShapeView
 * @param {CoordinateSystem} cs The CoordinateSystem used to define the marker size.
 * @constructor
 */
class EditLineShapeView extends EditShapeView {
	setPointList(pointlist, origin, angle) {
		// our lines have no angle...
		super.setPointList(pointlist, origin, angle);
	}

	getMarkerPoints() {
		const points = [];
		const self = this;
		this._markers.forEach((marker) => {
			const point = marker.center.copy();
			self._rotmatrix.rotatePoint(point);
			point.add(self._origin);
			points.push(point);
		});
		return points;
	}
}

export default EditLineShapeView;
