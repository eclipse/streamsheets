/* global document image */

import {default as JSG, ImagePool, Notification, NotificationCenter, LayoutNode, LayoutSection} from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';


export default class AddDashBoardItem extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'adddashboard';
		this.group = 'adddashboard';
		this.element = new Image();
		this.element.src = `lib/res/svg/add.svg`
		this.element.style.cursor = 'pointer';
		this.position = 'tri';
	}

	isVisible(item) {
		return (item.getParent() instanceof LayoutNode) && !item.isProtected();
	}

	onEvent(event, item, editor) {
		const handled = event.type === 'click';
		if (handled) {
			this.createSelection(event, editor, item);
		}
		return handled;
	}

	createSelection(event, editor, item) {
		const canvas = editor.getGraphicSystem().getCanvas();
		const toolBox = document.createElement('div');
		const menu = event.target.parentNode.parentNode;
		const mouseDown = (ev) => {
			const divRect = toolBox.getBoundingClientRect();
			if (ev.touches && ev.touches.length) {
				if (ev.touches[0].clientX <= divRect.left || ev.touches[0].clientX >= divRect.right ||
					ev.touches[0].clientY <= divRect.top || ev.touches[0].clientY >= divRect.bottom) {
					document.removeEventListener('mousedown', mouseDown, false);
					document.removeEventListener('touchstart', mouseDown, false);
					canvas.parentNode.removeChild(toolBox);
				}
			} else if (ev.clientX <= divRect.left || ev.clientX >= divRect.right ||
				ev.clientY <= divRect.top || ev.clientY >= divRect.bottom) {
				document.removeEventListener('mousedown', mouseDown, false);
				document.removeEventListener('touchstart', mouseDown, false);
				canvas.parentNode.removeChild(toolBox);
			}
		};

		toolBox.style.left = `${menu.offsetLeft + menu.clientWidth + 5}px`;
		toolBox.style.top = `${menu.offsetTop}px`;
		toolBox.style.position = 'absolute';
		toolBox.style.backgroundColor = '#eeeeee';
		toolBox.style.border = '1px solid #999999';
		toolBox.style.padding = '0px 8px 8px 8px';
		toolBox.style.boxShadow = '0 0px 5px 0 rgba(0, 0, 0, 0.1), 0 0px 5px 0 rgba(0, 0, 0, 0.1)';

		document.addEventListener('mousedown', mouseDown, false);
		document.addEventListener('touchstart', mouseDown, false);

		const addTitle = (titletext) => {
			const title = document.createElement('p');
			title.innerHTML = titletext;
			title.style.fontFamily = "Roboto";
			title.style.fontSize = '9pt';
			title.style.fontWeight = 'bold';
			title.style.marginBottom = '5px';
			title.style.marginTop = '10px';

			toolBox.appendChild(title);
		}

		const addDashBoardItem = (ev, type) => {
			let node;
			switch (type) {
			case 'layout':
				node = new JSG.LayoutNode();
				node.getPin().setLocalPoint(0, 0);
				node.setOrigin(0, 0);
				node._rowData = [new LayoutSection(3000), new LayoutSection(3000)];
				break;
			case 'text': {
				node = new JSG.TextNode('Title');
				const f = node.getTextFormat();
				f.setHorizontalAlignment(JSG.TextFormatAttributes.TextAlignment.LEFT);
				f.setVerticalAlignment(JSG.TextFormatAttributes.VerticalTextAlignment.TOP);
				f.setRichText(false);
				f.setFontSize(18);
				node.associate(false);
				node.setHeight(1000);
				break;
			}
			case 'check':
				node = new JSG.SheetCheckboxNode();
				node.setHeight(800);
				break;
			case 'slider':
				node = new JSG.SheetSliderNode();
				node.setHeight(1500);
				break;
			case 'knob':
				node = new JSG.SheetKnobNode();
				node.setHeight(3000);
				break;
			// case 'sheet': {
			// 	NotificationCenter.getInstance().send(
			// 		new Notification(NotificationCenter.ADD_SHEET_NOTIFICATION, this));
			// 	node = new JSG.StreamSheetWrapper();
			// 	editor.getGraph()._sheetWrapper = node;
			// 	node.getFormat().setLineCorner(75);
			// 	node.setHeight(5000);
			// 	break;
			// }
			default:
				node = new JSG.SheetPlotNode();
				type = node.setChartType(type);
				node.series.forEach((serie) => {
					serie.type = type;
				});
				node.getFormat().setLineCorner(75);
				node.getFormat().setLineColor(JSG.theme.border);
				node.setChartTypeForSeries(type);
				node.setHeight(5000);
				break;
			}
			if (node) {
				editor.getInteractionHandler().execute(new JSG.AddItemCommand(node, item));
			}
		};

		const addElement = (id, subtitle, icon) => {
			const pdiv = document.createElement('div');
			pdiv.style.textAlign = 'center';
			pdiv.style.display = 'inline-block';
			pdiv.addEventListener('click', (ev) => addDashBoardItem(ev, id), false);
			const div = document.createElement('div');
			div.id = id;
			// div.style.margin = '4px 4px 4px 0px';
			div.style.height = '48px';
			div.style.width = '48px';
			div.style.backgroundImage = `url(${icon})`;
			div.style.backgroundPosition = 'center center';
			div.style.backgroundRepeat = 'no-repeat';
			pdiv.appendChild(div);
			const label = document.createElement('label');
			label.innerHTML = subtitle;
			label.style.fontFamily = "Roboto";
			label.style.fontSize = '8pt';
			label.style.textAlign = 'center';
			pdiv.appendChild(label);
			toolBox.appendChild(pdiv);
		};

		addTitle('Timeline');
		addElement('scatterline', 'Line (XY)', 'images/charts/line.png');
		addElement('line', 'Line (Cat)', 'images/charts/line.png');
		addElement('column', 'Column', 'images/charts/column.png');
		addElement('area', 'Area', 'images/charts/area.png');
		addElement('stateperiod', 'State', 'images/charts/stateperiod.png');
		addTitle('Chart');
		addElement('column', 'Column', 'images/charts/column.png');
		addElement('gauge', 'Gauge', 'images/charts/gauge.png');
		addElement('pie', 'Pie', 'images/charts/Pie.png');
		addElement('map', 'Map', 'images/charts/map.png');
		addTitle('Control');
		addElement('check', 'Checkbox', 'lib/res/svg/checkbox.svg');
		addElement('slider', 'Slider', 'lib/res/svg/slider.svg');
		addElement('knob', 'Knob', 'lib/res/svg/knob.svg');
		addElement('text', 'Title', 'lib/res/svg/label.svg');
		// addTitle('Table');
		// addElement('sheet', 'Sheet', 'lib/res/svg/sheet.svg');
		// addElement('layout', 'Layout', 'lib/res/svg/layout.svg');


		canvas.parentNode.appendChild(toolBox);
	}
};
