/* global document */

import { default as JSG, ImagePool, SheetPlotNode } from '@cedalo/jsg-core';
import ItemMenuEntry from '../ItemMenuEntry';


export default class StreamChartSeries extends ItemMenuEntry {
	constructor() {
		super();
		this.id = 'del';
		this.element = JSG.imagePool.get(ImagePool.SVG_FILTER);
	}

	isVisible(item) {
		return item instanceof SheetPlotNode
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
		toolBox.style.backgroundColor = 'white';
		toolBox.style.border = '1px solid #999999';
		toolBox.style.padding = '8px';
		toolBox.style.boxShadow = '0 0px 5px 0 rgba(0, 0, 0, 0.1), 0 0px 5px 0 rgba(0, 0, 0, 0.1)';

		document.addEventListener('mousedown', mouseDown, false);
		document.addEventListener('touchstart', mouseDown, false);

		const title = document.createElement('p');
		title.innerHTML = "Show Series";
		title.style.fontFamily = "Roboto";
		title.style.fontSize = '9pt';
		title.style.marginBottom = '5px';

		toolBox.appendChild(title);

		const checkBoxChange = (ev) => {
			const cmd = item.prepareCommand('series');
			const serie = item.series[Number(ev.target.value)];
			serie.visible = ev.target.checked;
			item.finishCommand(cmd, 'series');
			editor.getInteractionHandler().execute(cmd);
		};

		item.series.forEach((serie, index) => {
			const checkBox = document.createElement('input');
			checkBox.type = 'checkbox';
			checkBox.id = `serie${index}`;
			checkBox.value = `${index}`;
			checkBox.name = `serie${index}`;
			checkBox.checked = serie.visible;
			checkBox.style.margin = '4px 4px 4px 0px';
			checkBox.style.height = '20px';
			checkBox.addEventListener('change', checkBoxChange, false);
			toolBox.appendChild(checkBox);
			const label = document.createElement('label');
			label.for = checkBox.name;
			const ref = item.getDataSourceInfo(serie.formula);
			if (ref && ref.yName !== undefined) {
				label.innerHTML = ref.yName;
			} else {
				label.innerHTML = String(item.series.indexOf(serie) + 1);
			}
			label.style.fontFamily = "Roboto";
			label.style.fontSize = '8pt';
			label.style.verticalAlign = 'super';
			toolBox.appendChild(label);
			toolBox.appendChild(document.createElement('br'));
		});

		canvas.parentNode.appendChild(toolBox);
	}
};
