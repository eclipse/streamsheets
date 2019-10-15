import JSG from '@cedalo/jsg-ui';

const {
	GraphItemView,
	Graph,
	TextFormatAttributes,
} = JSG;

export default class SelectionItemView extends GraphItemView {
	constructor(item, id) {
		super(item, id);
		this.graphId = id;
	}

	draw(graphics) {
		if (!this._item.isVisible()) {
			return;
		}

		graphics.save(this);

		const tmprect = this._item.getSize().toRectangle(JSG.rectCache.get());
		// translate & rotate:
		let item = this.getItem();
		const pt = JSG.ptCache.get();

		while (!(item instanceof Graph)) {
			const origin = item.getOrigin(pt);
			graphics.translate(origin.x, origin.y);
			graphics.rotate(item.getAngle().getValue());
			item = item.getParent();
		}
		JSG.ptCache.release(pt);

		graphics.setLineWidth(200);
		graphics.setTransparency(30);

		this._shapeRenderer.drawShapeBorder(this._item._shape, this._item.isClosed(), graphics);

		graphics.setTransparency(100);
		graphics.setFontName('Verdana');
		graphics.setFontSize(7);
		graphics.setFont();
		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.RIGHT);
		graphics.setTextBaseline('bottom');
		graphics.setLineWidth(-1);
		graphics.setFillColor('#BBBBBB');
		graphics.setLineWidth(-1);

		graphics.fillText(this.graphId, tmprect.getRight(), tmprect.y - 100);

		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);
		graphics.setTextBaseline('alphabetic');
		graphics.setFillColor('#FFFFFF');

		graphics.restore();

		JSG.rectCache.release(tmprect);
	}
}
