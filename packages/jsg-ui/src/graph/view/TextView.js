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
import { FormatAttributes, TextFormatAttributes, TextNodeAttributes, default as JSG } from '@cedalo/jsg-core';
import NodeView from './NodeView';

/**
 * This view is for a {{#crossLink "TextNode"}}{{/crossLink}} model. Although it
 * can be instantiated directly the recommended way to create this view is by calling
 * {{#crossLink "NodeController/createView:method"}}{{/crossLink}} method.
 *
 * @class TextView
 * @extends NodeView
 * @param {TextNode} item The corresponding TextNode model.
 * @constructor
 */
class TextView extends NodeView {
	drawFill(graphics, format, rect) {
		super.drawFill(graphics, format, rect);

		this.drawText(graphics, format, rect);
	}

	drawText(graphics, format, rect) {
		const item = this._item;
		const textFormat = item.getTextFormat();
		let text;

		if (item._editing) {
			return;
		}

		// if an icon is defined, use that
		if (textFormat.getIcon().getValue() === 0) {
			text = item.getText().getValue();
		} else {
			text = String.fromCharCode(textFormat.getIcon().getValue());
		}

		if (text === undefined || text === '') {
			return;
		}

		const paras = item._paras || [];
		const attributes = item.getItemAttributes();
		let type;
		let sections;

		textFormat.applyToGraphics(graphics);
		graphics.setFont();

		graphics.setLineColor(textFormat.getFontColor().getValue());
		graphics.setLineWidth(FormatAttributes.LineStyle.HAIRLINE);

		const emLog = item._getLogEm(graphics, textFormat);

		this.setLinkTextFormat(graphics, format);

		// force bottom for now for exact alignment
		graphics.setTextBaseline('bottom');

		// space for lists
		let prevType;
		let counter = 1;

		graphics.setTextAlignment(TextFormatAttributes.TextAlignment.LEFT);

		const halign = textFormat.getHorizontalAlignment().getValue();
		const valign = textFormat.getVerticalAlignment().getValue();

		let xoffset = 0;
		let yoffset = 0;

		if (rect.width !== item._sizeText.x) {
			switch (halign) {
				case TextFormatAttributes.TextAlignment.LEFT:
					xoffset = 0;
					break;
				case TextFormatAttributes.TextAlignment.CENTER:
					xoffset = (rect.width - item._sizeText.x) / 2;
					break;
				case TextFormatAttributes.TextAlignment.RIGHT:
					xoffset = rect.width - item._sizeText.x;
					break;
			}
		}
		if (
			rect.height !== item._sizeText.y ||
			item
				.getItemAttributes()
				.getMinimumHeight()
				.getValue()
		) {
			if (
				(attributes.getSizeMode().getValue() & TextNodeAttributes.SizeMode.HEIGHT ||
					item
						.getItemAttributes()
						.getMaximumHeight()
						.getValue()) &&
				rect.height < item._sizeText.y
			) {
				yoffset = 0;
			} else {
				switch (valign) {
					case TextFormatAttributes.VerticalTextAlignment.TOP:
						yoffset = 0;
						break;
					case TextFormatAttributes.VerticalTextAlignment.CENTER:
						yoffset = (rect.height - item._sizeText.y) / 2;
						break;
					case TextFormatAttributes.VerticalTextAlignment.BOTTOM:
						yoffset = rect.height - item._sizeText.y;
						break;
				}
			}
		}
		// TODO if first char is a whitespace, ignore

		paras.forEach((para) => {
			sections = para.getSections();
			type = para.getType();

			if (type !== prevType) {
				counter = 1;
			}

			sections.forEach((section, j) => {
				text = section.getText();
				text = text.replace(/&nbsp;/g, ' ');

				section.setFont(graphics);

				if (section._fontColor !== undefined) {
					graphics.setFillColor(section._fontColor);
					graphics.setLineColor(section._fontColor);
				}

				if (j === 0) {
					switch (type) {
						case JSG.Paragraph.LIST_UL:
							graphics.beginPath();
							graphics.circle(
								xoffset + attributes.getLeftMargin().getValue() + emLog / 2,
								yoffset + section._yOffset - section._metrics.baseline / 2,
								emLog / 7
							);
							graphics.fill();
							break;
						case JSG.Paragraph.LIST_OL:
							graphics.fillText(
								`${counter}.`,
								xoffset + attributes.getLeftMargin().getValue() + 50,
								yoffset + section._yOffset
							);
							break;
					}
				}

				graphics.fillText(text, xoffset + section._xOffset, yoffset + section._yOffset);
			});

			counter += 1;
			prevType = type;
		});

		textFormat.removeFromGraphics(graphics);
	}

	setLinkTextFormat(graphics, format) {}
}

export default TextView;
