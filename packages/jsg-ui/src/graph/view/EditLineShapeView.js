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
