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
import { default as JSG, FormatAttributes } from '@cedalo/jsg-core';
import Graphics from './Graphics';

/**
 * The Scalable Graphics class encapsulates all graphics output. It provides output, transformation and information
 * functions to visualize graphical information. In addition to the graphics class, it uses the given coordinates
 * system to support zooming and logical coordinates.
 *
 * @class ScalableGraphics
 * @extends Graphics
 * @constructor
 * @param {Canvas} canvas Canvas to be used for output.
 * @param {CoordinateSystem} coordinatesystem Coordinate System to be used within graphics. The
 *     coordinate system is used for all output to convert between logical and device units
 */
class ScalableGraphics extends Graphics {
	drawImage(image, x, y, width, height, sx, sy, swidth, sheight) {
		if (sx !== undefined && sy !== undefined && swidth !== undefined && sheight !== undefined) {
			super.drawImage(
				image,
				this._cs.logToDeviceX(x),
				this._cs.logToDeviceY(y),
				this._cs.logToDeviceX(width),
				this._cs.logToDeviceY(height),
				sx,
				sy,
				swidth,
				sheight
			);
		} else if (width !== undefined && height !== undefined) {
			super.drawImage(
				image,
				this._cs.logToDeviceX(x),
				this._cs.logToDeviceY(y),
				this._cs.logToDeviceX(width),
				this._cs.logToDeviceY(height)
			);
		} else {
			super.drawImage(image, this._cs.logToDeviceX(x), this._cs.logToDeviceY(y));
		}
	}

	getImageData(x, y, width, height) {
		return super.getImageData(
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y),
			this._cs.logToDeviceX(width),
			this._cs.logToDeviceY(height)
		);
	}

	putImageData(image, x, y) {
		super.putImageData(image,
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y)
		);
	}

	fillText(text, x, y) {
		super.fillText(text, this._cs.logToDeviceX(x), this._cs.logToDeviceY(y));
	}

	fillRectangle(x, y, width, height) {
		super.fillRectangle(
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y),
			this._cs.logToDeviceX(width),
			this._cs.logToDeviceY(height)
		);
	}

	fillRoundedRectangle(x, y, width, height, rlt, rrt, rlb, rrb) {
		super.fillRoundedRectangle(
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y),
			this._cs.logToDeviceX(width),
			this._cs.logToDeviceY(height),
			this._cs.logToDeviceY(rlt),
			this._cs.logToDeviceY(rrt),
			this._cs.logToDeviceY(rlb),
			this._cs.logToDeviceY(rrb)
		);
	}

	drawRoundedRectangle(x, y, width, height, rlt, rrt, rlb, rrb) {
		super.drawRoundedRectangle(
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y),
			this._cs.logToDeviceX(width),
			this._cs.logToDeviceY(height),
			this._cs.logToDeviceY(rlt),
			this._cs.logToDeviceY(rrt),
			this._cs.logToDeviceY(rlb),
			this._cs.logToDeviceY(rrb)
		);
	}

	drawRectangle(x, y, width, height) {
		super.drawRectangle(
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y),
			this._cs.logToDeviceX(width),
			this._cs.logToDeviceY(height)
		);
	}

	rect(x, y, width, height) {
		super.rect(
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y),
			this._cs.logToDeviceX(width),
			this._cs.logToDeviceY(height)
		);
	}

	drawText(text, atX, atY) {
		super.drawText(text, this._cs.logToDeviceX(atX), this._cs.logToDeviceY(atY));
	}

	moveTo(x, y) {
		super.moveTo(this._cs.logToDeviceX(x), this._cs.logToDeviceY(y));
	}

	lineTo(x, y) {
		super.lineTo(this._cs.logToDeviceX(x), this._cs.logToDeviceY(y));
	}

	bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
		super.bezierCurveTo(
			this._cs.logToDeviceX(cp1x),
			this._cs.logToDeviceY(cp1y),
			this._cs.logToDeviceX(cp2x),
			this._cs.logToDeviceY(cp2y),
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y)
		);
	}

	quadraticCurveTo(cpx, cpy, x, y) {
		super.quadraticCurveTo(
			this._cs.logToDeviceX(cpx),
			this._cs.logToDeviceY(cpy),
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y)
		);
	}

	arc(x, y, radius, startAngle, endAngle, anticlockwise) {
		super.arc(
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y),
			this._cs.logToDeviceX(radius),
			startAngle,
			endAngle,
			anticlockwise
		);
	}

	ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise) {
		super.ellipse(
			this._cs.logToDeviceX(x),
			this._cs.logToDeviceY(y),
			this._cs.logToDeviceX(radiusX),
			this._cs.logToDeviceX(radiusY),
			rotation,
			startAngle,
			endAngle,
			anticlockwise
		);
	}

	drawPixel(x, y) {
		super.drawPixel(this._cs.logToDeviceX(x), this._cs.logToDeviceX(y));
	}

	translate(dx, dy) {
		super.translate(this._cs.logToDeviceX(dx), this._cs.logToDeviceY(dy));
	}

	scale(aX, aY) {
		super.scale(this._cs.logToDeviceX(aX), this._cs.logToDeviceX(aY));
	}

	addClipRect(rect) {
		const tmprect = JSG.rectCache.get();
		tmprect.set(
			this._cs.logToDeviceX(rect.x),
			this._cs.logToDeviceY(rect.y),
			this._cs.logToDeviceX(rect.width),
			this._cs.logToDeviceY(rect.height)
		);
		super.addClipRect(tmprect);
		JSG.rectCache.release(tmprect);
	}

	setImageClip(rect) {
		const tmprect = JSG.rectCache.get();
		tmprect.set(
			this._cs.logToDeviceX(rect.x),
			this._cs.logToDeviceY(rect.y),
			this._cs.logToDeviceX(rect.width),
			this._cs.logToDeviceY(rect.height)
		);
		super.setImageClip(tmprect);
		JSG.rectCache.release(tmprect);
	}

	setShadow(color, offsetX, offsetY, blur, bounds) {
		let apply = false;
		if (this.isContextDefined()) {
			blur = this._filter('shadowblur', blur);
			offsetX = this._filter('shadowoffset', offsetX);
			offsetY = this._filter('shadowoffset', offsetY);
			apply = offsetX || offsetY || blur;
			if (apply) {
				this._context2D.shadowColor = color;
				this._context2D.shadowOffsetX = this._cs.logToDeviceX(offsetX);
				this._context2D.shadowOffsetY = this._cs.logToDeviceY(offsetY);
				//    this._context2D.shadowBlur = blur;
				this._context2D.shadowBlur = this._cs.getZoom() * blur;
			}
		}
		return apply;
	}

	createLinearGradient(x0, y0, x1, y1) {
		if (!this.isContextDefined()) {
			return undefined;
		}

		return super.createLinearGradient(
			this._cs.logToDeviceX(x0),
			this._cs.logToDeviceY(y0),
			this._cs.logToDeviceX(x1),
			this._cs.logToDeviceY(y1)
		);
	}

	createRadialGradient(x0, y0, r0, x1, y1, r1) {
		if (!this.isContextDefined()) {
			return undefined;
		}

		return super.createRadialGradient(
			this._cs.logToDeviceX(x0),
			this._cs.logToDeviceY(y0),
			this._cs.logToDeviceX(r0),
			this._cs.logToDeviceX(x1),
			this._cs.logToDeviceY(y1),
			this._cs.logToDeviceX(r1)
		);
	}

	setLineWidth(w) {
		if (this.isContextDefined()) {
			let wNew;
			if (w === FormatAttributes.LineStyle.HAIRLINE) {
				// due to display problems on android and in IE 10 with dotted lines
				wNew = JSG.touchDevice ? 1.0 : 1.01;
			} else {
				wNew = Math.max(0.01, this._cs.logToDeviceX(w));
			}

			if (wNew !== this._context2D.lineWidth) {
				this._context2D.lineWidth = Math.max(1, Math.round(wNew));
			}
		}

		this._lineWidth = w;
		return w;
	}

	relativeToDevice(p) {
		return this.transformPoint(this._cs.logToDeviceX(p.x), this._cs.logToDeviceY(p.y), 0);
	}
}

export default ScalableGraphics;
