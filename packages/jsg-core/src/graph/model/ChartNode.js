const Node = require('./Node');
const FormatAttributes = require('../attr/FormatAttributes');
const ItemAttributes = require('../attr/ItemAttributes');
const Strings = require('../../commons/Strings');
const CellRange = require('./CellRange');

module.exports = class ChartNode extends Node {
	constructor() {
		super();

		this.getFormat().setLineStyle(FormatAttributes.LineStyle.SOLID);
		this.getItemAttributes().setPortMode(ItemAttributes.PortMode.NONE);

		this.data = {
			chartType: 'column',
			coherent: true,
			hasCategoryLabels: 'auto',
			hasSeriesLabels: 'auto',
			categoryLabelData: [],
			direction: 'auto',
			range: '',
			formatRange: '',
			categoryRange: '',
			stacked: false,
			smooth: true,
			step: false,
			fill: false,
			hideEmpty: 'none',
			angle: Math.PI * 2,
			series: undefined
		};
		this.title = {
			title: '',
			font: {
				fontName: 'Verdana',
				fontSize: '12',
				bold: false,
				italic: false,
				color: '#000000'
			}
		};
		this.legend = {
			position: 'right',
			font: {
				fontName: 'Verdana',
				fontSize: '7',
				bold: false,
				italic: false,
				color: '#000000'
			}
		};
		this.scales = {
			xAxes: [
				{
					id: 'XAxis1',
					ticks: {
						// beginAtZero: true,
						fontFamily: 'Verdana',
						fontSize: '7',
						fontColor: '#000000',
						fontStyle: 'normal',
						minRotation: 0,
						maxRotation: 90
					},
					gridLines: {
						display: false,
						color: '#DDDDDD'
					}
				}
			],
			yAxes: [
				{
					id: 'YAxis1',
					ticks: {
						// beginAtZero: true,
						fontFamily: 'Verdana',
						fontSize: '7',
						fontColor: '#000000',
						fontStyle: 'normal',
						minRotation: 0,
						maxRotation: 90
					},
					gridLines: {
						display: true,
						color: '#DDDDDD'
					}
				}
			]
		};
	}

	copyChartContent() {
		const chart = {};

		chart.data = JSON.parse(JSON.stringify(this.data));
		chart.title = JSON.parse(JSON.stringify(this.title));
		chart.legend = JSON.parse(JSON.stringify(this.legend));
		chart.scales = JSON.parse(JSON.stringify(this.scales));

		return chart;
	}

	_copy(copiednodes, deep, ids) {
		const copy = super._copy(copiednodes, deep, ids);

		copy.data = JSON.parse(JSON.stringify(this.data));
		copy.title = JSON.parse(JSON.stringify(this.title));
		copy.legend = JSON.parse(JSON.stringify(this.legend));
		copy.scales = JSON.parse(JSON.stringify(this.scales));

		return copy;
	}

	resetScales() {
		// TODO reset based on type change
		this.scales.xAxes.length = 1;
		this.scales.yAxes.length = 1;

		const clean = (axis) => {
			delete axis.type;
			delete axis.ticks.min;
			delete axis.ticks.max;
			delete axis.ticks.stepSize;
			delete axis.ticks.position;
		};

		const xAxis = this.scales.xAxes[0];
		clean(xAxis);
		const yAxis = this.scales.yAxes[0];
		clean(yAxis);

		switch (this.getChartType()) {
			case 'column':
			case 'stackedcolumn':
			case 'line':
			case 'area':
			case 'radar':
			case 'polarArea':
				xAxis.gridLines.display = false;
				yAxis.gridLines.display = true;
				break;
			case 'bar':
			case 'stackedbar':
				xAxis.gridLines.display = true;
				yAxis.gridLines.display = false;
				break;
			case 'bubble':
			case 'scatter':
			case 'scatterLine':
				this.data.coherent = true;
				this.data.hasCategoryLabels = 'auto';
				this.data.hasSeriesLabels = 'auto';
				this.data.direction = 'auto';
				xAxis.gridLines.display = true;
				yAxis.gridLines.display = true;
				break;
			case 'pie':
			case 'doughnut':
				xAxis.gridLines.display = false;
				yAxis.gridLines.display = false;
				break;
		}
	}

	newInstance() {
		return new ChartNode();
	}

	getUniqueAxisName(x) {
		let name;
		let i = 1;
		let axis;
		/* eslint-disable no-loop-func */
		while (true) {
			if (x) {
				name = `XAxis${i}`;
				axis = this.scales.xAxes.filter((laxis) => laxis.id === name);
			} else {
				name = `YAxis${i}`;
				axis = this.scales.yAxes.filter((laxis) => laxis.id === name);
			}
			if (!axis.length) {
				break;
			}
			i += 1;
		}
		/* eslint-enable no-loop-func */

		return name;
	}

	getAxisByName(name) {
		let axis = this.scales.xAxes.filter((laxis) => laxis.id === name);
		if (axis.length) {
			return axis[0];
		}
		axis = this.scales.yAxes.filter((laxis) => laxis.id === name);

		if (axis.length) {
			return axis[0];
		}
		return undefined;
	}

	saveContent(file, absolute) {
		super.saveContent(file, absolute);

		file.writeAttributeString('type', 'chartnode');
		file.writeAttributeString('data', JSON.stringify(this.data));
		file.writeAttributeString('title', JSON.stringify(this.title));
		file.writeAttributeString('legend', JSON.stringify(this.legend));
		file.writeAttributeString('scales', JSON.stringify(this.scales));
	}

	read(reader, object) {
		super.read(reader, object);

		const getJSON = (tag) => {
			const data = reader.getAttribute(object, tag);
			if (data) {
				return JSON.parse(Strings.decodeXML(data));
			}
			return undefined;
		};

		let json = getJSON('data');
		if (json) {
			this.data = json;
		}
		json = getJSON('title');
		if (json) {
			this.title = json;
		}
		json = getJSON('legend');
		if (json) {
			this.legend = json;
		}
		json = getJSON('scales');
		if (json) {
			this.scales = json;
		}

		const data = reader.getAttribute(object, 'charttype');
		if (data) {
			this.data.chartType = data;
		}
	}

	setChartType(type) {
		this.data.chartType = type;
	}

	getChartType() {
		return this.data.chartType;
	}

	getSheet() {
		let sheet = this;

		while (sheet && !sheet.getCellDescriptors) {
			sheet = sheet.getParent();
		}

		return sheet;
	}

	getDataRange() {
		if (this.data.range === undefined || this.data.range === '') {
			return undefined;
		}
		const sheet = this.getSheet();
		return CellRange.parse(this.data.range.substring(1), sheet);
	}

	setDataRangeString(rangeText) {
		this.data.range = rangeText;
	}

	getDataRangeString() {
		return this.data.range;
	}

	getFormatDataRange() {
		if (this.data.formatRange === undefined || this.data.formatRange === '') {
			return undefined;
		}
		const sheet = this.getSheet();
		return CellRange.parse(this.data.formatRange.substring(1), sheet);
	}

	setFormatDataRangeString(rangeText) {
		this.data.formatRange = rangeText;
	}

	getFormatDataRangeString() {
		return this.data.formatRange;
	}

	getCategoryDataRange() {
		if (this.data.categoryRange === undefined || this.data.categoryRange === '') {
			return undefined;
		}
		const sheet = this.getSheet();
		return CellRange.parse(this.data.categoryRange.substring(1), sheet);
	}

	setCategoryDataRangeString(rangeText) {
		this.data.categoryRange = rangeText;
	}

	getCategoryDataRangeString() {
		return this.data.categoryRange;
	}

	getSheetContainer() {
		let ws = this.getParent();
		while (ws && !ws.getCellDescriptors) {
			ws = ws.getParent();
		}

		return ws;
	}

	_assignName(id) {
		const name = this.getGraph().getUniqueName('Chart');
		this.setName(name);
	}

	isAddLabelAllowed() {
		return true;
	}
};
