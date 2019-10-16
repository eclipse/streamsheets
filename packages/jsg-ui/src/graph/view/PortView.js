import { default as JSG, FormatAttributes } from '@cedalo/jsg-core';
import GraphItemView from './GraphItemView';

/**
 * This view can be used to visualize a {{#crossLink "Port"}}{{/crossLink}} model.
 * Although it can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "PortController/createView:method"}}{{/crossLink}} method.
 *
 * @class PortView
 * @extends GraphItemView
 * @param {Port} item The corresponding Port model.
 * @constructor
 */
class PortView extends GraphItemView {
	drawFill(graphics, format, rect) {}

	drawBorder(graphics, format, rect) {
		graphics.setLineColor('#0000FF');
		graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);
		this._shapeRenderer.drawShapeBorder(this._item._shape, this._item.isClosed(), graphics);
	}
}

export default PortView;
