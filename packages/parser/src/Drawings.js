/********************************************************************************
 * Copyright (c) 2020 Cedalo AG
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 ********************************************************************************/
/* eslint-disable no-mixed-operators */


const { NullTerm } = require('./Term');
const { ERROR, OK } = require('./ReturnCodes');

/**
 * Container to collect data from draw functions.
 * @type {module.Drawings}
 */
module.exports = class Drawings {
	constructor() {
		this._graphItems = {};
	}

	getGraphParam(terms, index, defaultValue) {
		if (index >= terms.length) {
			return defaultValue;
		}

		const term = terms[index];
		if (term instanceof NullTerm) {
			return defaultValue;
		}
		return term.value;
	}

	getGraphItem(nameItem) {
		if (this._graphItems[nameItem] === undefined) {
			this._graphItems[nameItem] = {};
		}

		return this._graphItems[nameItem];
	}

	updateGraphItem(scope, terms, type) {
		const getRectParams = (item) => {
			item.width = this.getGraphParam(terms, 5, 100);
			item.height = this.getGraphParam(terms, 6, 100);
			item.line = this.getGraphParam(terms, 7, '');
			item.fill = this.getGraphParam(terms, 8, '');
			item.attributes = this.getGraphParam(terms, 9, '');
			item.events = this.getGraphParam(terms, 10, '');
			item.angle = this.getGraphParam(terms, 11, 0);
			item.rotcenter = this.getGraphParam(terms, 12, 4);
		};

		if (terms.length < 6 || !this.checkParam(terms, 2)) {
			return ERROR.ARGS;
		}

		const item = this.getGraphItem(String(terms[0].value));
		if (item === undefined) {
			return ERROR.INVALID;
		}


		item.source = scope.graphCells.evaluating ? 'name' : 'cell';
		item.sheetname = String(this.getGraphParam(terms, 0, ''));
		item.parent = String(this.getGraphParam(terms, 1, ''));
		item.name = String(this.getGraphParam(terms, 2, ''));
		item.type = type;
		item.x = this.getGraphParam(terms, 3, 0);
		item.y = this.getGraphParam(terms, 4, 0);

		const cell = scope.graphCells._cells.get(item.sheetname);
		if (cell) {
			item.formula = cell.formula;
		}

		switch (type) {
		case 'label':
			getRectParams(item);
			if (terms.length > 13) {
				item.label = terms.length > 13 ?  terms[13].toString() : '';
			}
			item.text = String(this.getGraphParam(terms, 13, ''));
			item.font = String(this.getGraphParam(terms, 14, ''));
			break;
		case 'rectangle':
		case 'ellipse':
			getRectParams(item);
			break;
		case 'plot':
			getRectParams(item);
			break;
		case 'chart':
			getRectParams(item);
			item.charttype = String(this.getGraphParam(terms, 13, 'column'));
			if (terms.length > 14) {
				const term = terms[14];
				item.range = term.toString();
			}
			if (terms.length > 15) {
				const term = terms[15];
				item.formatrange = term.toString();
			}
			break;
		case 'polygon':
		case 'bezier':
			getRectParams(item);
			if (terms.length > 13) {
				const term = terms[13];
				item.range = term.toString();
			}
			item.close = this.getGraphParam(terms, 14, true);
			break;
		case 'line':
			item.x2 = this.getGraphParam(terms, 5, 100);
			item.y2 = this.getGraphParam(terms, 6, 100);
			item.line = this.getGraphParam(terms, 7, '');
			break;
		case 'checkbox':
		case 'button':
			getRectParams(item);
			item.text = String(this.getGraphParam(terms, 13, ''));
			item.font = String(this.getGraphParam(terms, 14, ''));
			if (terms.length > 15) {
				const term = terms[15];
				item.value = term.isStatic ? term.value : term.toString();
			}
			break;
		case 'slider':
			getRectParams(item);
			item.text = String(this.getGraphParam(terms, 13, ''));
			item.font = String(this.getGraphParam(terms, 14, ''));
			if (terms.length > 15) {
				const term = terms[15];
				item.value = term.isStatic ? term.value : term.toString();
			}
			item.min = this.getGraphParam(terms, 16, 0);
			item.max = this.getGraphParam(terms, 17, 100);
			item.step = this.getGraphParam(terms, 18, 10);
			item.scalefont = String(this.getGraphParam(terms, 19, ''));
			item.marker = String(this.getGraphParam(terms, 20, ''));
			if (terms.length > 21) {
				const term = terms[21];
				item.formatrange = term.isStatic ? term.value : term.toString();
			}
			break;
		case 'knob':
			getRectParams(item);
			item.text = String(this.getGraphParam(terms, 13, ''));
			item.font = String(this.getGraphParam(terms, 14, ''));
			if (terms.length > 15) {
				const term = terms[15];
				item.value = term.isStatic ? term.value : term.toString();
			}
			item.min = this.getGraphParam(terms, 16, 0);
			item.max = this.getGraphParam(terms, 17, 100);
			item.step = this.getGraphParam(terms, 18, 10);
			item.scalefont = String(this.getGraphParam(terms, 19, ''));
			item.marker = String(this.getGraphParam(terms, 20, ''));
			if (terms.length > 21) {
				const term = terms[21];
				item.formatrange = term.isStatic ? term.value : term.toString();
			}
			item.start = this.getGraphParam(terms, 22, Math.PI / 6);
			item.end = this.getGraphParam(terms, 23, Math.PI * 11 / 6);
			break;
		default:
			break;
		}

		return OK.TRUE;
	}

	setGraphItems(graphItems) {
		if (graphItems === undefined) {
			this._graphItems = {};
		} else {
			this._graphItems = graphItems;
		}
	}

	getGraphItems() {
		return this._graphItems;
	}

	checkParam(terms, index) {
		return terms.length > index && terms[index].value !== null && terms[index].value !== undefined;
	}

	getEvents(terms) {
		let result;

		let i = 0;
		while (this.checkParam(terms, i)) {
			if (terms[i].name && terms[i].params && terms[i].params.length) {
				const event = {
					event: terms[i].name.toUpperCase(),
					func: terms[i].params[0].toString(),
				};

				const paramstrs = terms[i].params
					? terms[i].params.reduce((strings, param) => {
						strings.push(param.toString());
						return strings;
					}, [])
					: [];
				event.func = paramstrs.join(',');

				if (result === undefined) {
					result = [];
				}
				result.push(event);
			}
			i += 1;
		}

		return result ? JSON.stringify(result) : '';
	}

	getAttributes(terms) {
		const result = {};

		// visible
		if (this.checkParam(terms, 0)) {
			result.visible = terms[0].value;
		}
		// container
		if (this.checkParam(terms, 1)) {
			result.container = String(terms[1].value);
		}
		// clip
		if (this.checkParam(terms, 2)) {
			result.clip = !!terms[2].value;
		}
		// selectable
		if (this.checkParam(terms, 3)) {
			result.selectable = !!terms[3].value;
		}

		return JSON.stringify(result);
	}

	getLineFormat(terms) {
		const result = {};

		if (this.checkParam(terms, 0)) {
			result.color = String(terms[0].value);
		}
		if (this.checkParam(terms, 1)) {
			result.style = Number(terms[1].value);
		}
		if (this.checkParam(terms, 2)) {
			result.width = Number(terms[2].value);
		}

		if (this.checkParam(terms, 3)) {
			result.startArrow = Number(terms[3].value);
		}

		if (this.checkParam(terms, 4)) {
			result.endArrow = Number(terms[4].value);
		}

		return JSON.stringify(result);
	}

	getFontFormat(terms) {
		const result = {};

		if (this.checkParam(terms, 0)) {
			result.fontname = String(terms[0].value);
		}
		if (this.checkParam(terms, 1)) {
			result.fontsize = Number(terms[1].value);
		}
		if (this.checkParam(terms, 2)) {
			result.fontstyle = Number(terms[2].value);
		}
		if (this.checkParam(terms, 3)) {
			result.fontcolor = String(terms[3].value);
		}
		if (this.checkParam(terms, 4)) {
			result.alignment = Number(terms[4].value);
		}

		return JSON.stringify(result);
	}

	getLinearGradientFill(terms) {
		const result = {};

		result.type = 'gradient';
		result.style = 0;

		if (this.checkParam(terms, 0)) {
			result.startcolor = String(terms[0].value);
		} else {
			result.startcolor = '#000000';
		}

		if (this.checkParam(terms, 1)) {
			result.endcolor = String(terms[1].value);
		} else {
			result.endcolor = '#FFFFFF';
		}

		if (this.checkParam(terms, 2)) {
			result.angle = Number(terms[2].value);
		} else {
			result.angle = 0;
		}

		return JSON.stringify(result);
	}

	getRadialGradientFill(terms) {
		const result = {};

		result.type = 'gradient';
		result.style = 1;

		if (this.checkParam(terms, 0)) {
			result.startcolor = String(terms[0].value);
		} else {
			result.startcolor = '#000000';
		}

		if (this.checkParam(terms, 1)) {
			result.endcolor = String(terms[1].value);
		} else {
			result.endcolor = '#FFFFFF';
		}

		if (this.checkParam(terms, 2)) {
			result.xOffset = Number(terms[2].value);
		} else {
			result.xOffset = 50;
		}

		if (this.checkParam(terms, 3)) {
			result.yOffset = Number(terms[3].value);
		} else {
			result.yOffset = 50;
		}

		return JSON.stringify(result);
	}

	getPatternFill(terms) {
		const result = {};

		result.type = 'pattern';
		if (this.checkParam(terms, 0)) {
			result.image = String(terms[0].value);
		}

		return JSON.stringify(result);
	}

	getPatternVideo(terms) {
		const result = {};

		result.type = 'video';
		if (this.checkParam(terms, 0)) {
			result.video = String(terms[0].value);
		} else {
			result.video = '';
		}

		return JSON.stringify(result);
	}

	getQRCode(terms) {
		if (!this.checkParam(terms, 0)) {
			return ERROR.ARGS;
		}

		return `qrcode:${String(terms[0].value)}`;
	}

	static isPointOnLineSegment(point, linestart, lineend) {
		// taken from getLinePointDistance which returns a Math.sqrt() value, which is not needed here...
		const dist = (v, wx, wy) => ((v.x - wx) * (v.x - wx)) + ((v.y - wy) * (v.y - wy));

		const getSquaredPointLineSegmentDistance = (p, v, w) => {
			let d;

			d = dist(v, w.x, w.y);
			if (d === 0) {
				d = dist(p, v.x, v.y);
			} else {
				const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / d;
				if (t < 0) {
					d = dist(p, v.x, v.y);
				} else if (t > 1) {
					d = dist(p, w.x, w.y);
				} else {
					d = dist(p, v.x + t * (w.x - v.x), v.y + t * (w.y - v.y));
				}
			}
			return d;
		};

		return getSquaredPointLineSegmentDistance(point, linestart, lineend) < 0.1;
	}

	/**
	 * Checks whether a point lies within a polygon.
	 *
	 * @method isPointInPolygon
	 * @param {Point}points Array of points that describe the polygon.
	 * @param {Point}p Point to check for.
	 * @return {Boolean}Returns true, if point lies within the polygon, else false.
	 * @static
	 */
	static isPointInPolygon(points, p) {
		let p1 = points[0];
		let inside = false;
		let i;

		for (i = 1; i <= points.length; i += 1) {
			const p2 = points[i % points.length];
			// bail out early if point is on current line segment...
			if (this.isPointOnLineSegment(p, p1, p2)) {
				return 0;
			}
			if ((p1.y < p.y && p2.y >= p.y) || (p2.y < p.y && p1.y >= p.y)) {
				if (p1.x + (((p.y - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x)) < p.x) {
					inside = !inside;
				}
			}
			p1 = p2;
		}
		return inside ? 1 : -1;
	}

	ptInPolygon(sheet, terms) {
		const value = (cell) => {
			const val = cell && cell.value;
			return (val != null && (typeof val === 'number')) ? val : 0;
		};

		if (terms.length < 3) {
			return ERROR.ARGS;
		}

		const p = {
			x: Number(terms[0].value),
			y: Number(terms[1].value)
		};
		const pts = [];

		const range = terms[2].value;
		// must be a range...
		if (range && range.start && range.end) {
			if (range.width !== 2) {
				return ERROR.ARGS;
			}

			let pt;

			// sheet of cellsref might differ from function sheet
			// ({ sheet } = cellsref.sheet);
			range.iterate((cell) => {
				if (pt === undefined) {
					pt = {};
				}
				if (pt.x !== undefined) {
					pt.y = value(cell);
					pts.push(pt);
					pt = undefined;
				} else {
					pt.x = value(cell);
				}
			});
		} else {
			return ERROR.ARGS;
		}

		return Drawings.isPointInPolygon(pts, p);
	}

	toGraphItemsJSON() {
		return this._graphItems;
	}

	toJSON() {
		return {};
	}
};
