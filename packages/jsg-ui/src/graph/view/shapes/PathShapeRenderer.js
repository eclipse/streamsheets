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
import { default as JSG } from '@cedalo/jsg-core';
import PolygonShapeRenderer from './PolygonShapeRenderer';

/**
 * Private helper class to perform the corresponding {{#crossLink "Graphics"}}{{/crossLink}} draw
 * commands depending on specified path command id.
 *
 * @class Commands
 * @constructor
 * @private
 */
const Commands = (() => {
	const cmds = {
		M(index, coordinates, graphics) {
			const coord = coordinates[index];
			graphics.moveTo(coord.getX().getValue(), coord.getY().getValue());
			return index;
		},
		L(index, coordinates, graphics) {
			const coord = coordinates[index];
			graphics.lineTo(coord.getX().getValue(), coord.getY().getValue());
			return index;
		},
		C(index, coordinates, graphics) {
			const cp1 = coordinates[index];
			const cp2 = coordinates[(index + 1) % coordinates.length];
			const coord = coordinates[(index + 2) % coordinates.length];
			graphics.bezierCurveTo(
				cp1.getX().getValue(),
				cp1.getY().getValue(),
				cp2.getX().getValue(),
				cp2.getY().getValue(),
				coord.getX().getValue(),
				coord.getY().getValue()
			);
			return index + 2;
		},
		Q(index, coordinates, graphics) {
			const cp = coordinates[index];
			const coord = coordinates[(index + 1) % coordinates.length];
			graphics.quadraticCurveTo(
				cp.getX().getValue(),
				cp.getY().getValue(),
				coord.getX().getValue(),
				coord.getY().getValue()
			);
			return index + 1;
		}
	};
	return {
		/**
		 * Returns a suitable function to perform the drawing for a given coordinate command id. If none could be found
		 * <code>undefined</code> is returned.<br/>
		 * The returned function must be called with following parameters (in that order):
		 * <ul>
		 * <li>index - The current index in shapes coordinates array.</li>
		 * <li>coordinates - The shapes coordinates array.</li>
		 * <li>graphics - The <code>Graphics</code> instance to use for drawing.</li>
		 * </ul>
		 * As a result the function returns the new current index in provided coordinates array.
		 *
		 * @method cmdFor
		 * @param {String} cmdid The command id to get the command function for.
		 * @return {Function} The function to use for drawing or <code>undefined</code>.
		 */
		cmdFor(cmdid) {
			return cmds[cmdid];
		}
	};
})();

/**
 * This class to renderer a {{#crossLink "PathShape"}}{{/crossLink}}.
 *
 * @class PathShapeRenderer
 * @extends PolygonShapeRenderer
 * @constructor
 */
class PathShapeRenderer extends PolygonShapeRenderer {
	constructor() {
		super();
		/**
		 * A private flag to track a draw by {{#crossLink
		 * "PathShapeRenderer/drawShapeFill:method"}}{{/crossLink}} or {{#crossLink
		 * "PathShapeRenderer/drawShapeBorder:method"}}{{/crossLink}} since we want to draw the
		 * path only once.
		 *
		 * @property _isDrawn
		 * @type {Boolean}
		 * @private
		 */
		this._isDrawn = false;
	}

	// overwritten to init drawn flag
	init(shape, graphics) {
		this._isDrawn = false;
	}

	/**
	 * Overwritten from base class to ensure path is drawn only once.
	 *
	 * @method drawShapeFill
	 * @param {Shape} shape Shape to fill.
	 * @param {boolean} closed True, if shape should be closed. This is primarily used for polygons and bezier curves to
	 * connect the last with the first point.
	 * @param {Graphics} graphics Graphics to use for rendering.
	 * @for PathShapeRenderer
	 */
	drawShapeFill(shape, closed, graphics) {
		// draw is done either in draw-fill or in draw-border
		if (!this._isDrawn) {
			this.render(shape, graphics);
			this._isDrawn = true;
		}
	}

	/**
	 * Overwritten from base class to ensure path is drawn only once.
	 *
	 * @method drawShapeBorder
	 * @param {Shape} shape Shape to draw border for.
	 * @param {boolean} closed True, if shape should be closed. This is primarily used for polygons and bezier curves to
	 * connect the last with the first point.
	 * @param {Graphics} graphics Graphics to use for rendering.
	 */
	drawShapeBorder(shape, closed, graphics) {
		// draw is done either in draw-fill or in draw-border
		if (!this._isDrawn) {
			this.render(shape, graphics);
			this._isDrawn = true;
		}
	}

	/**
	 * This is called by {{#crossLink "PathShapeRenderer/drawShapeFill:method"}}{{/crossLink}} or
	 * {{#crossLink "PathShapeRenderer/drawShapeBorder:method"}}{{/crossLink}} to render given
	 * path-shape.
	 *
	 * @method render
	 * @param {PathShape} shape The path-shape to render.
	 * @param {Graphics} graphics Graphics to use for rendering.
	 */
	render(shape, graphics) {
		const format = shape._item ? shape._item.getFormat() : undefined;
		let hasBorder = false;
		if (format) {
			const tmprect = shape._item.getSize().toRectangle(JSG.rectCache.get());
			// TODO check: do we need to remove fill from graphics again?
			format.applyFillToGraphics(graphics, tmprect);
			hasBorder = format.applyLineToGraphics(graphics);
			JSG.rectCache.release(tmprect);
		}

		// dash? TODO only works in IE >= 11 :(
		graphics.applyLineDash();
		this._drawPath(shape, graphics);
		graphics.clearLineDash();
		if (hasBorder) {
			format.removeLineFromGraphics(graphics);
		}
	}

	/**
	 * This is called to actually draw a given path-shape.
	 *
	 * @method _drawPath
	 * @param {PathShape} shape The path-shape to draw.
	 * @param {Graphics} graphics Graphics to use for drawing.
	 * @private
	 */
	_drawPath(shape, graphics) {
		let lastcoord;
		const coordinates = shape.getCoordinates();
		let cmd;
		let cmdid;
		let lastcmdid = 'M';

		graphics.beginPath();

		coordinates.forEach((coord, i) => {
			cmdid = coord.cmd || (lastcmdid === 'M' ? 'L' : lastcmdid);
			if (cmdid === 'M') {
				this._closePath(lastcoord, graphics);
			}
			cmd = Commands.cmdFor(cmdid);
			i = cmd ? cmd(i, coordinates, graphics) : i;
			lastcoord = coordinates[i];
			lastcmdid = cmdid;
		});

		// finally close path to stroke or fill...
		this._closePath(lastcoord, graphics, true);
	}

	/**
	 * Called to close a path or sub-path.
	 *
	 * @method _closePath
	 * @param {Coordinate} coord The current coordinate.
	 * @param {Graphics} graphics Graphics used to fill or stroke (sub-)path.
	 * @param {Boolean} last A flag which indicates if given coordinate is the last one.
	 * @private
	 */
	_closePath(coord, graphics, last) {
		if (coord) {
			if (coord.close === 'Z') {
				graphics.closePath();
				// seems that SVG applies fill only on last closed path...
				if (last) {
					graphics.fill();
				}
			}
			graphics.stroke();
		}
	}
}

export default PathShapeRenderer;
