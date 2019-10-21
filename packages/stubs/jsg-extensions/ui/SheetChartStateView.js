export default function SheetChartStateViewFactory(JSG, ...args) {
	class SheetChartStateView extends JSG.NodeView {
		drawBorder(/* graphics, format, rect */) {}

		drawFill(/* graphics, format, rect */) {}
	}
	return new SheetChartStateView(...args);
}
