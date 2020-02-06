const SheetReference = require ('../expr/SheetReference');
const Node = require('./Node');
const ItemAttributes = require('../attr/ItemAttributes');
const Expression = require('../expr/Expression');
const Numbers = require('../../commons/Numbers');

class ChartRect {
	constructor(left, top, right, bottom) {
		this.set(left, top, right, bottom);
	}

	reset() {
		this.left = 0;
		this.right = 0;
		this.top = 0;
		this.bottom = 0;
	}

	containsPoint(pt) {
		return pt.x >= this.left && pt.x <= this.right && pt.y >= this.top && pt.y <= this.bottom;
	}

	set(left, top, right, bottom) {
		this.left = left || 0;
		this.top = top || 0;
		this.right = right || 0;
		this.bottom = bottom || 0;
	}

	get width() {
		return this.right - this.left;
	}

	get height() {
		return this.bottom - this.top;
	}
}


module.exports = class SheetPlotNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineColor('#AAAAAA');
		this.getFormat().setFillColor('#FFFFFF');
		this.getTextFormat().setFontSize(9);

		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);
		this.getItemAttributes().setContainer(false);

		this.series = [];
		this.chart = {
			margins: new ChartRect(150, 150, 150, 150),
		};
		this.xAxes = [{
			type: 'linear',
			align: 'bottom',
			formula: new Expression(0, 'AXIS(E2,E3,E4,F2,F3)'),
			position: new ChartRect(),
			size: 500,
		}];
		this.yAxes = [{
			type: 'linear',
			align: 'left',
			formula: new Expression(0, 'AXIS(D2,D3,D4)'),
			position: new ChartRect(),
			size: 1000,
		}];
		this.plot = {
			position: new ChartRect()
		};
		this.title = {
			formula: new Expression(0, 'A1'),
			position: new ChartRect(),
			size: 1000
		};
	}

	getExpressionValue(expr) {
		if (expr === undefined) {
			return '';
		}

		const term = expr.getTerm();
		if (term) {
			const { operand } = term;

			if (operand instanceof SheetReference) {
				const range = operand._range.copy();
				range.shiftFromSheet();
				const cell = range._worksheet.getDataProvider().getRC(range._x1, range._y1);
				return cell ? cell.getValue() : '';
			}
		}

		return expr.getValue();
	}

	layout() {
		const size = this.getSize().toPoint();

		this.plot.position.left = this.chart.margins.left;
		this.plot.position.top = this.chart.margins.top;
		this.plot.position.bottom = size.y - this.chart.margins.bottom;
		this.plot.position.right = size.x - this.chart.margins.right;

		const title = String(this.getExpressionValue(this.title.formula));
		if (title.length) {
			this.plot.position.top += this.title.size;
			this.title.position.top = this.chart.margins.top;
			this.title.position.left = this.chart.margins.left;
			this.title.position.right = size.x - this.chart.margins.right;
			this.title.position.bottom = this.chart.margins.top + this.title.size;
		} else {
			this.title.position.reset();
		}

		this.xAxes.forEach((axis) => {
			switch (axis.align) {
			case 'top':
				this.plot.position.top -= axis.size;
				break;
			case 'bottom':
				this.plot.position.bottom -= axis.size;
				break;
			}
		});

		this.yAxes.forEach((axis) => {
			switch (axis.align) {
			case 'left':
				this.plot.position.left += axis.size;
				break;
			case 'right':
				this.plot.position.right -= axis.size;
				break;
			}
		});

		this.xAxes.forEach((axis) => {
			Object.assign(axis.position, this.plot.position);
			switch (axis.align) {
			case 'bottom':
				axis.position.top = this.plot.position.bottom;
				axis.position.bottom = axis.position.top + axis.size;
				break;
			}
		});

		this.yAxes.forEach((axis) => {
			Object.assign(axis.position, this.plot.position);
			switch (axis.align) {
			case 'left':
				axis.position.right = this.plot.position.left;
				axis.position.left = this.plot.position.left - axis.size;
				break;
			}
		});

		super.layout();
	}

	getParamInfo(term, index) {
		if (term && term.params && term.params.length > index) {
			const { operand } = term.params[index];
			if (operand instanceof SheetReference) {
				const range = operand._range.copy();
				range.shiftFromSheet();
				return { sheet: operand._item, range };
			}
		}
		return undefined;
	}

	getParamValue(term, index) {
		const info = this.getParamInfo(term, index);
		if (info) {
			const cell = info.sheet.getDataProvider().getRC(info.range._x1, info.range._y1);
			return cell ? cell.getValue() : undefined;
		}
		if (term && term.params && term.params.length > index) {
			return Number(term.params[index].value);
		}
		return undefined;
	}

	getParamFormat(term, index) {
		const info = this.getParamInfo(term, index);
		if (info) {
			const tf = info.sheet.getTextFormatAtRC(info.range._x1, info.range._y1);
			return {
				localCulture: tf.getLocalCulture().getValue().toString(),
				numberFormat: tf.getNumberFormat().getValue()
			}
		}
		return undefined;
	}

	isTimeAggregateRange(sheet, range) {
		if (range.getWidth() !== 1 || range.getHeight() !== 1) {
			return undefined;
		}
		const cell = sheet.getDataProvider().getRC(range._x1, range._y1);
		const expr = cell ? cell.getExpression() : undefined;
		if (expr === undefined) {
			return undefined;
		}
		const formula = expr.getFormula();

		if (formula && formula.indexOf('TIMEAGGREGATE') !== -1) {
			return cell;
		}

		return undefined;
	}

	getDataSourceInfo(ds) {
		const ret = {
			x: this.getParamInfo(ds.getTerm(), 1),
			y: this.getParamInfo(ds.getTerm(), 2)
		};
		ret.xTime = ret.x ? this.isTimeAggregateRange(ret.x.sheet, ret.x.range) : false;
		ret.yTime = ret.y ? this.isTimeAggregateRange(ret.y.sheet, ret.y.range) : false;

		return ret;
	}

	getAxes(x, y) {
		const fill = ((axis) => {
			const { formula } = axis;
			const term = formula.getTerm();
			const result = {
				min: this.getParamValue(term, 0),
				max: this.getParamValue(term, 1),
				step: this.getParamValue(term, 2),
				minZoom: this.getParamValue(term, 3),
				maxZoom: this.getParamValue(term, 4),
			};

			result.format = this.getParamFormat(term, 0);

			if (result.minZoom !== undefined) {
				result.min = result.minZoom;
			}
			if (result.maxZoom !== undefined) {
				result.max = result.maxZoom;
			}
			if (result.min === undefined) {
				result.min = axis.minData;
			}
			if (result.max === undefined) {
				result.max = axis.maxData;
			}
			if (result.step === undefined) {
				result.step = 10;
			}
			if (axis.step < 0) {
				axis.step = 1;
			}
			if (axis.max <= axis.min) {
				axis.max = axis.min + 100;
			}
			axis.scale = result;
		});

		fill(this.xAxes[x]);
		fill(this.yAxes[y]);

		return {
			x: this.xAxes[x],
			y: this.yAxes[y]
		};
	}

	getValue(ref, index, value) {
		value.x = 0;
		value.y = 0;

		if (this.xAxes[0].type === 'category') {
			value.x = index;
		} else if (ref.xTime) {
			const values = ref.xTime.getValues();
			if (values && values.length > index) {
				value.x = values[index].key;
			}
		} else if (ref.x && index <= ref.x.range._y2 - ref.x.range._y1) {
			const cell = ref.x.sheet.getDataProvider().getRC(ref.x.range._x1, ref.x.range._y1 + index);
			if (cell) {
				value.x = cell.getValue();
				if (!Numbers.isNumber(value.x)) {
					value.x = 0;
				}
			}
		}

		if (ref.yTime) {
			const values = ref.yTime.getValues();
			if (values && values.length > index) {
				value.y = values[index].value;
				return true;
			}
		} else if (ref.y && index <= ref.y.range._y2 - ref.y.range._y1) {
			const cell = ref.y.sheet.getDataProvider().getRC(ref.y.range._x1, ref.y.range._y1 + index);
			if (cell) {
				value.y = cell.getValue();
				if (!Numbers.isNumber(value.y)) {
					value.y = 0;
				}
			}
			return true;
		}

		return false;
	}

	scaleToAxis(info, value) {

		value = (value - info.min) / (info.max - info.min);

		return value;
	}

	scaleFromAxis(info, point) {
		point.x -= this.plot.position.left;

		return info.min + point.x / (this.plot.position.right - this.plot.position.left) * (info.max - info.min);
	}

	isElementHit(pt) {
		let result;
		const dataPoints = [];
		let dataIndex = 0;

		if (this.title.position.containsPoint(pt)) {
			return {
				element: 'title',
				data: this.title
			};
		}

		if (this.plot.position.containsPoint(pt)) {
			result = this.series.filter((series, index) => {
				const ref = this.getDataSourceInfo(series.formula);
				const dataRect = new ChartRect();
				const plotRect = this.plot.position;
				if (ref) {
					const axes = this.getAxes(0, 0);
					let pointIndex = 0;
					let x;
					let y;
					const value = {};

					while (this.getValue(ref, pointIndex, value)) {
						x = this.scaleToAxis(axes.x.scale, value.x);
						y = this.scaleToAxis(axes.y.scale, value.y);
						dataRect.set(plotRect.left + x * plotRect.width - 200,
							plotRect.bottom - y * plotRect.height - 200,
							plotRect.left + x * plotRect.width + 200,
							plotRect.bottom - y * plotRect.height + 200);
						if (dataRect.containsPoint(pt)) {
							dataPoints.push(value);
							dataIndex = index;
							return true;
						}
						pointIndex += 1;
					}
				}
				return false;
			});
			if (result.length) {
				return {
					element: 'datarow',
					index: dataIndex,
					data: result[0],
					dataPoints
				};
			}
		}

		result = this.xAxes.filter((axis) => axis.position.containsPoint(pt));
		if (result.length) {
			return {
				element: 'xAxis',
				data: result[0]
			};
		}

		result = this.yAxes.filter((axis) => axis.position.containsPoint(pt));
		if (result.length) {
			return {
				element: 'yAxis',
				data: result[0]
			};
		}

		if (this.plot.position.containsPoint(pt)) {
			return {
				element: 'plot',
				data: this.plot
			};
		}

		return undefined;
	}

	setMinMax() {
		let xMin = Number.MAX_VALUE;
		let xMax = Number.MIN_VALUE;
		let yMin = Number.MAX_VALUE;
		let yMax = Number.MIN_VALUE;
		let valid = false;

		this.series.forEach((series, index) => {
			const ref = this.getDataSourceInfo(series.formula);
			if (ref) {
				let pointIndex = 0;
				const value = {};

				while (this.getValue(ref, pointIndex, value)) {
					xMin = Math.min(value.x, xMin);
					xMax = Math.max(value.x, xMax);
					yMin = Math.min(value.y, yMin);
					yMax = Math.max(value.y, yMax);
					pointIndex += 1;
					valid = true;
				}
			}
		});

		if (!valid) {
			xMin = 0;
			xMax = 100;
			yMin = 0;
			yMax = 100;
		}
		if (xMin >= xMax) {
			xMax = xMin + 1;
		}
		if (yMin >= yMax) {
			yMax = yMin + 1;
		}

		this.xAxes[0].minData = xMin;
		this.xAxes[0].maxData = xMax;
		this.yAxes[0].minData = yMin;
		this.yAxes[0].maxData = yMax;
	}

	createSeriesFromSelection(selection, type) {
		this.series = [{
			type,
			formula: new Expression(0, 'DATAROW(B1,A2:A10,B2:B10)'),
		}, {
			type,
			formula: new Expression(0, 'DATAROW(C1,A2:A10,C2:C10)'),
		}, {
			type,
			formula: new Expression(0, 'DATAROW(,A12,A12)')
		}];
		this.evaluate();
	}

	newInstance() {
		return new SheetPlotNode();
	}

	evaluate() {
		super.evaluate();
		this.series.forEach((serie) => {
			serie.formula.evaluate(this);
		});
		this.xAxes.forEach((axis) => {
			axis.formula.evaluate(this);
		});
		this.yAxes.forEach((axis) => {
			axis.formula.evaluate(this);
		});
		this.title.formula.evaluate(this);
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		this.series.forEach((serie, index) => {
		 	copy.series.push({
				type: serie.type,
				formula: serie.formula.copy()
			});
		});

		return copy;
	}

	saveContent(writer, absolute) {
		super.saveContent(writer, absolute);

		writer.writeAttributeString('type', 'sheetplotnode');

		writer.writeStartElement('plot');
		writer.writeStartArray('series');

		this.series.forEach((serie, index) => {
			writer.writeStartElement('series');
			serie.formula.save('formula', writer);
			writer.writeEndElement();
		});
		writer.writeEndArray('series');

		writer.writeEndElement();
	}

	read(reader, object) {
		super.read(reader, object);


		const plot = reader.getObject(object, 'plot');
		if (plot) {
			this.series = [];
			reader.iterateObjects(plot, (name, child) => {
				switch (name) {
				case 'series': {
					const serie = [];
					reader.iterateObjects(child, (subName, subChild) => {
						switch (subName) {
						case 'formula':
							serie.formula = new Expression(0);
							serie.formula.read(reader, subChild);
							break;
						}
					});
					this.series.push(serie);
					break;
				}
				}
			});
		}
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Plot');
		this.setName(name);
	}

	getSheet() {
		let sheet = this;

		while (sheet && !sheet.getCellDescriptors) {
			sheet = sheet.getParent();
		}

		return sheet;
	}

	isAddLabelAllowed() {
		return false;
	}
};
