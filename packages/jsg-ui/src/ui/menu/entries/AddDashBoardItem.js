/* global document */

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
				node.associate(false);
				break;
			}
			default:
				node = new JSG.SheetPlotNode();
				type = node.setChartType(type);
				node.series.forEach((serie) => {
					serie.type = type;
				});

				node.setChartTypeForSeries(type);
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
			div.style.height = '50px';
			div.style.width = '50px';
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

		addTitle('Charts');
		addElement('line', 'Line', 'images/charts/line.png');
		addElement('scatterline', 'Timeline', 'images/charts/line.png');
		addElement('column', 'Column', 'images/charts/column.png');
		addElement('bar', 'Bar', 'images/charts/bar.png');
		addElement('gauge', 'Gauge', 'images/charts/gauge.png');
		toolBox.appendChild(document.createElement('br'));
		addElement('map', 'Map', 'images/charts/map.png');
		toolBox.appendChild(document.createElement('br'));
		addTitle('Other');
		addElement('text', 'Label', 'lib/res/svg/table.svg');
		addElement('layout', 'Layout', 'lib/res/svg/table.svg');


		canvas.parentNode.appendChild(toolBox);
	}
};
