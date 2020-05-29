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
import { default as JSG, FormatAttributes, TextFormatAttributes } from '@cedalo/jsg-core';
import LayerId from '../view/LayerId';

/**
 * Helper class which provides useful methods to highlight a possible move or drop target and to create insert markers.
 * To create highlights use {{#crossLink "Highlighter/createHighlight:method"}}{{/crossLink}}
 The created
 * highlights can then be added to any layer of a {{#crossLink "GraphView"}}{{/crossLink}}. To customize
 * these highlights use options objects like defined in {{#crossLink
 * "Highlighter/OPTIONS:property"}}{{/crossLink}} or {{#crossLink
 * "Highlighter/MARKER_OPTIONS:property"}}{{/crossLink}}. Finally it is possible to subclass
 * Highlighter and to overwrite the methods of interest. To globally register a customized Highlighter simply replace
 * {{#crossLink "Highlighter/getDefault:method"}}{{/crossLink}} with a function which returns the
 * custom Highlighter subclass.
 *
 * @class Highlighter
 * @constructor
 * @since 1.6.3
 */
class Highlighter {
	/**
	 * Convenience method to create and add a highlight for given controller. The highlight is created by calling
	 * {{#crossLink "Highlighter/createHighlight:method"}}{{/crossLink}} and is added to the
	 * {{#crossLink "LayerId/TARGETCONTAINER:property"}}{{/crossLink}} layer. An optional options object
	 * can be passed. If not given the {{#crossLink "Highlighter/OPTIONS:property"}}{{/crossLink}}
	 * object will be used.
	 *
	 * @method highlightController
	 * @param {ModelController} controller The controller to highlight.
	 * @param {ControllerViewer} viewer The ControllerViewer used by calling interaction.
	 * @param {Object} [options] An optional options object.
	 */
	highlightController(controller, viewer, options) {
		const highlight = this.createHighlight(controller, options);
		if (highlight) {
			controller.getView().adaptHighlight(highlight);
			viewer.getLayer(LayerId.TARGETCONTAINER).push(highlight);
		}
	}

	/**
	 * Creates a Feedback instance to highlight the bounds of given controller. The feedback can be used to mark a
	 * controller as possible drop or move target. To customize the feedback an optional options object can be passed.
	 * If not given the
	 * {{#crossLink "Highlighter/OPTIONS:property"}}{{/crossLink}} object will be used.
	 *
	 * @method createHighlight
	 * @param {ModelController} controller The target model controller.
	 * @param {Object} [options] An optional options object.
	 * @return {Feedback} A Feedback instance to use as highlight.
	 */
	createHighlight(controller, options) {
		const viewer = controller.getViewer();
		const zoom = viewer ? viewer.getZoom() : 1;
		const feedback = controller.createFeedback();
		const fbFormat = feedback.getFormat();
		options = options || Highlighter.OPTIONS;
		fbFormat.setFillColor(options.format.getFillColor().getValue());
		fbFormat.setLineColor(options.format.getLineColor().getValue());
		fbFormat.setLineWidth(options.format.getLineWidth().getValue() / zoom);
		fbFormat.setLineStyle(options.format.getLineStyle().getValue());
		if (options.textformat && options.text && options.text.length) {
			// draw the hint text as decoration:
			/* eslint-disable func-names */
			feedback.getFeedbackView().drawDecorations = function(graphics, rect) {
				options.textformat.applyToGraphics(graphics, true);
				graphics.setFont();
				graphics.fillText(JSG.getLocalizedString(options.text), 0, this._item.getHeight().getValue() + 100);
			};
			/* eslint-enable func-names */
		}
		feedback.controller = controller;
		return feedback;
	}
}
/**
 * Returns the default <code>Highlighter</code> implementation.<br/>
 * Subclasses can simply replace this method to globally register a customized <code>Highlighter</code>.
 *
 * @method getDefault
 * @return {Highlighter} The global default <code>Highlighter</code> to use.
 * @static
 */
Highlighter.getDefault = (() => {
	const instance = new Highlighter();
	return () => instance;
})();

/**
 * An object which defines the default format and text format attributes to use for controller highlight.
 * This object defines following properties:
 * <ul>
 * <li><code>format</code> - A {{#crossLink "FormatAttributes"}}{{/crossLink}} list to define the fill
 * and border format</li>
 * <li><code>textformat</code> - A {{#crossLink "TextFormatAttributes"}}{{/crossLink}} list to define
 * text format</li>
 * <li><code>text</code> - The text to display</li>
 * </ul>
 *
 * @property OPTIONS
 * @type {Object}
 * @static
 */
Highlighter.OPTIONS = (() => {
	const format = new FormatAttributes();
	format.setFillColor('rgba(144,181,238,0.1)');
	format.setLineColor('rgba(144,181,238,0.7)');
	format.setLineWidth(150);
	format.setLineStyle(FormatAttributes.LineStyle.SOLID);
	const textformat = new TextFormatAttributes();
	textformat.setFontColor('#333333');
	textformat.setBaseline(TextFormatAttributes.TextBaseline.TOP);
	textformat.setHorizontalAlignment(TextFormatAttributes.TextAlignment.LEFT);
	textformat.setFontName('Arial');
	textformat.setFontSize(8);
	return {
		format,
		textformat,
		text: 'AddContainer'
	};
})();

/**
 * An object which defines the default values to use for position marker highlight.
 * This object defines following properties:
 * <ul>
 * <li><code>bgcolor</code> - A color {String} to use as background color for a position marker view.</li>
 * <li><code>fgcolor</code> - A color {String} to use as foreground color for a position marker view.</li>
 * </ul>
 *
 * @property MARKER_OPTIONS
 * @type {Object}
 * @static
 */
Highlighter.MARKER_OPTIONS = (() => ({
	// to use SelectionStyle.MARKER_FILL_COLOR constant we must load Highlighter later...
	bgcolor: '#90B5EE',
	fgcolor: '#333333'
}))();

export default Highlighter;
