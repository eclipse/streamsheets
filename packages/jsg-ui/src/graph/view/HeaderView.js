import { default as JSG, Point } from '@cedalo/jsg-core';

import NodeView from './NodeView';

/**
 * This view is for a {{#crossLink "HeaderNode"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class HeaderView
 * @extends NodeView
 * @param {HeaderNode} item The corresponding HeaderNode model.
 * @constructor
 */
export default class HeaderView extends NodeView {
	getWorksheetView() {
		let parent = this.getParent();
		if (parent) {
			parent = parent.getParent();
			if (parent) {
				return parent.getContentView();
			}
		}
		return undefined;
	}

	getSectionSplit(/* point */) {}

	getScrollOffset() {
		const ws = this.getWorksheetView();
		if (ws) {
			return ws.getScrollOffset();
		}

		return new Point(0, 0);
	}

	setFont(graphics) {
		graphics.setFontName('Verdana');
		graphics.setFontSize(9);
		graphics.setFillColor('#333333');
		graphics.setTextAlign(JSG.TextFormatAttributes.TextAlignment.CENTER);
		graphics.setTextBaseline('middle');
		graphics.setFont();
	}
}
