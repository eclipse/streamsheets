/* global document Image */

import {default as JSG, LayoutCell} from '@cedalo/jsg-core';
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
		return (item instanceof LayoutCell) && !item.isProtected();
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

		toolBox.style.left = menu.offsetLeft + menu.clientWidth + 221 < canvas.clientWidth ?
			`${menu.offsetLeft + menu.clientWidth + 5}px` :
			`${menu.offsetLeft - menu.clientWidth - 221}px`;
		toolBox.style.top = `${menu.offsetTop}px`;
		toolBox.style.width = '216px';
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
			case 'layout2':
			case 'layout3':
			case 'layout4':
			case 'layout5':
			case 'layout6': {
				const cmp = new JSG.CompoundCommand();
				let path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.LAYOUT);
				cmp.add(new JSG.SetAttributeAtPathCommand(item, path, 'column'));
				item.handleLayoutTypeChange('column', cmp);
				path = JSG.AttributeUtils.createPath(JSG.LayoutCellAttributes.NAME, JSG.LayoutCellAttributes.SECTIONS);
				cmp.add(new JSG.SetAttributeAtPathCommand(item, path, 2));
				item.handleLayoutColumnChange(Number(type.charAt(6)), cmp);
				editor.getInteractionHandler().execute(cmp);
				break;
			}
			case 'title': {
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
			case 'text': {
				node = new JSG.TextNode('Text');
				const tf = node.getTextFormat();
				const f = node.getFormat();
				tf.setHorizontalAlignment(JSG.TextFormatAttributes.TextAlignment.LEFT);
				tf.setVerticalAlignment(JSG.TextFormatAttributes.VerticalTextAlignment.TOP);
				f.setLineCorner(50);
				f.setLineStyle(JSG.FormatAttributes.LineStyle.SOLID);
				tf.setRichText(false);
				node.getItemAttributes().setLabel('Label');
				node.associate(false);
				node.setHeight(1000);
				break;
			}
			case 'edit': {
				node = new JSG.TextNode('Edit');
				const tf = node.getTextFormat();
				const f = node.getFormat();
				tf.setHorizontalAlignment(JSG.TextFormatAttributes.TextAlignment.LEFT);
				tf.setVerticalAlignment(JSG.TextFormatAttributes.VerticalTextAlignment.TOP);
				f.setLineCorner(50);
				f.setLineStyle(JSG.FormatAttributes.LineStyle.SOLID);
				tf.setRichText(false);
				node.getItemAttributes().setType(1);
				node.getItemAttributes().setLabel('Label');
				node.getItemAttributes().setReturnAction(1);
				node.associate(false);
				node.setHeight(1000);
				break;
			}
			case 'select': {
				node = new JSG.TextNode('Select');
				const tf = node.getTextFormat();
				const f = node.getFormat();
				tf.setHorizontalAlignment(JSG.TextFormatAttributes.TextAlignment.LEFT);
				tf.setVerticalAlignment(JSG.TextFormatAttributes.VerticalTextAlignment.TOP);
				f.setLineCorner(50);
				f.setLineStyle(JSG.FormatAttributes.LineStyle.SOLID);
				tf.setRichText(false);
				node.getItemAttributes().setType(2);
				node.getItemAttributes().setReturnAction(1);
				node.getItemAttributes().setLabel('Label');
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

		const addBreak = (id, subtitle, icon) => {
			const div = document.createElement('p');
			toolBox.appendChild(div);
		};

		const addElement = (id, subtitle, icon) => {
			const pdiv = document.createElement('div');
			pdiv.style.textAlign = 'center';
			pdiv.style.display = 'inline-block';
			pdiv.style.marginRight = '5px';
			pdiv.style.marginBottom = '5px';
			pdiv.addEventListener('click', (ev) => addDashBoardItem(ev, id), false);
			const div = document.createElement('div');
			div.id = id;
			// div.style.margin = '4px 4px 4px 0px';
			div.style.height = '33px';
			div.style.width = '38px';
			div.style.backgroundImage = `url(${icon})`;
			div.style.backgroundPosition = 'center center';
			div.style.backgroundRepeat = 'no-repeat';
			pdiv.appendChild(div);
			const label = document.createElement('label');
			label.innerHTML = subtitle;
			label.style.fontFamily = "Roboto";
			label.style.fontSize = '6pt';
			label.style.textAlign = 'center';
			pdiv.appendChild(label);
			toolBox.appendChild(pdiv);
		};

		addTitle('Chart');
		addElement('line', 'Line', 'images/charts/line.png');
		addElement('column', 'Column', 'images/charts/column.png');
		addElement('bar', 'Bar', 'images/charts/bar.png');
		addElement('area', 'Area', 'images/charts/area.png');
		addElement('scatterline', 'Line (XY)', 'images/charts/line.png');
		// addBreak();
		addElement('pie', 'Pie', 'images/charts/pie.png');
		addElement('doughnut', 'Doughnut', 'images/charts/doughnut.png');
		addElement('gauge', 'Gauge', 'images/charts/gauge.png');
		addElement('map', 'Map', 'images/charts/map.png');
		addTitle('Control');
		addElement('title', 'Title', 'lib/res/svg/label.svg');
		addElement('text', 'Text', 'lib/res/svg/textview.svg');
		addElement('edit', 'Edit', 'lib/res/svg/textedit.svg');
		addElement('select', 'Select', 'lib/res/svg/select.svg');
		addElement('check', 'Checkbox', 'lib/res/svg/checkbox.svg');
		addElement('slider', 'Slider', 'lib/res/svg/slider.svg');
		addElement('knob', 'Knob', 'lib/res/svg/knob.svg');
		addTitle('Layout');
		addElement('layout2', 'Layout 2', 'lib/res/svg/layout2.svg');
		addElement('layout3', 'Layout 3', 'lib/res/svg/layout3.svg');
		addElement('layout4', 'Layout 4', 'lib/res/svg/layout4.svg');
		addElement('layout5', 'Layout 5' , 'lib/res/svg/layout5.svg');
		addElement('layout6', 'Layout 6', 'lib/res/svg/layout6.svg');


		canvas.parentNode.appendChild(toolBox);
	}
};
