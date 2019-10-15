import { default as JSG, FormatAttributes } from '@cedalo/jsg-core';

import NodeView from './NodeView';

export default class ButtonView extends NodeView {
	draw(graphics) {
		graphics.save(this);
		const format = this._item.getFormat();
		const rect = this._item.getSize().toRectangle(JSG.rectCache.get());
		const pattern = format.getAttribute(FormatAttributes.PATTERN).getValue();
		const patternstyle = format.getAttribute(FormatAttributes.PATTERNSTYLE).getValue();

		this.translateGraphics(graphics);

		graphics.setFillStyle(FormatAttributes.FillStyle.PATTERN);
		graphics.setPattern(rect, pattern, patternstyle);
		graphics.fillRect(rect);

		graphics.restore();
		JSG.rectCache.release(rect);
	}
}
