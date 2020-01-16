export default function SheetChartStateViewFactory(JSG, ...args) {
	class SheetChartStateView extends JSG.NodeView {
		drawFill(graphics, format, rect) {
			const {x, y} = rect.getCenter();
			super.drawFill(graphics, format, rect);
			graphics.setFillColor('#444444');
			graphics.setTextAlignment(JSG.TextFormatAttributes.TextAlignment.CENTER);
			graphics.setTextBaseline('center');
			graphics.fillText('This is a feature of the professional version!', x, y);
		}
	}
	return new SheetChartStateView(...args);
}
