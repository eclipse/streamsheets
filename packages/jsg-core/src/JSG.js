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
/**
 * A JavaScript Graph Library
 * @author Tensegrity Software GmbH
 * @link   http://www.js-graph.com/
 * @license JSG - A JavaScript Graph Library
 * Version_Copyright Tensegrity Software GmbH. Use and distribution currently only with the consent of Tensegrity
 *     Software GmbH! Please read and follow the license agreement provided with this distribution. If there are any
 *     questions regarding the software license, please contact us.
 */

/* eslint-disable no-console */
const ConsoleLogger = {
	log(message) {
		if (typeof console !== 'undefined') console.log(message);
	},
	info(message) {
		if (typeof console !== 'undefined') {
			if (console.info) console.info(message);
			else console.log(message);
		}
	}
};
/* eslint-enable no-console */
// private static properties:
const jsg = {
	min_width_height: 50,
	propertyEventsDisabled: false
};
// eslint-disable-next-line
const lazyRequire = (module) => require(`${module}`);
const getOrCreate = (key, module, ...params) => {
	let val = jsg[key];
	if (val === undefined) {
		const Clazz = lazyRequire(module);
		val = Clazz ? new Clazz(...params) : null;
		jsg[key] = val;
	}
	return val;
};

/**
 * This class provides static helpers and global settings to configure and extend the library
 *
 * @class JSG
 */

class JSG {
	/**
	 * The minimum size for {{#crossLink "GraphItem"}}{{/crossLink}}s. The default value is 50.</br>
	 * If this is set to a negative value the minimum size will be ignored.
	 * @property MIN_WIDTH_HEIGHT
	 * @type {Number}
	 * @static
	 * @for JSG
	 */
	static get MIN_WIDTH_HEIGHT() {
		return jsg.min_width_height;
	}
	static set MIN_WIDTH_HEIGHT(val) {
		jsg.min_width_height = val;
	}

	/**
	 * Cache for font metrics.
	 * @property fontMetricsCache
	 * @type {Dictionary}
	 * @static
	 */
	static get fontMetricsCache() {
		return getOrCreate('fontMetricsCache', './commons/Dictionary');
	}
	static set fontMetricsCache(val) {
		jsg.fontMetricsCache = val;
	}

	/**
	 * Image Pool for image objects used in patterns.
	 * @property imagePool
	 * @type {ImagePool}
	 * @static
	 */
	static get imagePool() {
		return getOrCreate('imagePool', './commons/ImagePool');
	}
	static set imagePool(val) {
		jsg.imagePool = val;
	}

	/**
	 * A global TemplateStore instance to manage defined templates.
	 * @property TemplateStore
	 * @type {TemplateStore}
	 * @static
	 */
	static get tmplStore() {
		return getOrCreate('tmplStore', './graph/attr/TemplateStore');
	}
	static set tmplStore(val) {
		jsg.tmplStore = val;
	}

	/**
	 * Store copyied items. The store is an XML String with a saved representation of the selected GraphItems
	 * @property clipXML
	 * @type {String}
	 * @static
	 */
	static get clipXML() {
		return jsg.clipXML;
	}
	static set clipXML(val) {
		jsg.clipXML = val;
	}

	/**
	 * Offset for next paste operation
	 * @property clipOffset
	 * @type {Point} Offset to use, when inserting items after a paste operation.
	 * @static
	 */
	static get clipOffset() {
		return getOrCreate('clipOffset', './geometry/Point', 0, 0);
	}
	static set clipOffset(val) {
		jsg.clipOffset = val;
	}

	/**
	 * Store for copied format. This property holds a Format class, representing the format collected from a Copy Format
	 * command.
	 * @property clipFormat
	 * @type {FormatAttributes}
	 * @static
	 */
	static get clipFormat() {
		return jsg.clipFormat;
	}
	static set clipFormat(val) {
		jsg.clipFormat = val;
	}

	/**
	 * Store for copied format. This property holds an instance of TextFormatAttributes, representing the format collected
	 * from a Copy Format command.
	 * @property clipTextFormat
	 * @type {TextFormatAttributes}
	 * @static
	 */
	static get clipTextFormat() {
		return jsg.clipTextFormat;
	}
	static set clipTextFormat(val) {
		jsg.clipTextFormat = val;
	}

	static get commandFactory() {
		return getOrCreate('commandFactory', './graph/command/CommandFactory');
	}
	static set commandFactory(val) {
		jsg.commandFactory = val;
	}

	/**
	 * Default Factory to create GraphItems. This Factory is called, if a GraphItem is created using
	 * createGraphItemFromString. The default implementation creates the system known GraphItem implementations. If
	 * derived, it allows to create custom items by their name. This property can be overwritten by extending a
	 * GraphItemFactory class and assigning it to this property. See the description of GraphItemFactory to
	 * get more information.
	 * @property graphItemFactory
	 * @type {GraphItemFactory}
	 * @static
	 */
	static get graphItemFactory() {
		return getOrCreate('graphItemFactory', './graph/model/GraphItemFactory');
	}
	static set graphItemFactory(val) {
		jsg.graphItemFactory = val;
	}

	/**
	 * To intercept item attribute requests to disable or enable some item attributes based on dynamically evolving
	 * criteria. This can be useful for a GraphItem design mode, which allows editing GraphItems although the item
	 * attributes prohibit these edit actions normally or during a runtime mode.
	 * @property itemAttributesHandler
	 * @type {Function}
	 * @static
	 * @private
	 * @since 2.0.18
	 */
	static get itemAttributesHandler() {
		return jsg.itemAttributesHandler;
	}
	static set itemAttributesHandler(val) {
		jsg.itemAttributesHandler = val;
	}

	/**
	 * Property which defines the measured DPI values.<br/>
	 * <b>Note:</b> before using this property the library must be have been initialized by calling
	 * {{#crossLink "JSG/init:method"}}{{/crossLink}}.
	 *
	 * @property dpi
	 * @type {Point}
	 * @static
	 */
	static get dpi() {
		return getOrCreate('dpi', './geometry/Point', 72, 72);
	}
	static set dpi(val) {
		jsg.dpi = val;
	}

	/**
	 * This object is used to update ids of dropped or pasted {{#crossLink "GraphItem"}}{{/crossLink}}s.
	 * Usually it is not necessary to use this property.
	 * @property IdUpdater
	 * @type {IdUpdater}
	 * @static
	 * @since 2.0.22.0
	 *
	 */
	static get idUpdater() {
		return getOrCreate('idUpdater', './graph/model/IdUpdater');
	}
	static set idUpdater(val) {
		jsg.idUpdater = val;
	}

	static get layoutFactory() {
		jsg.layoutFactory = jsg.layoutFactory || lazyRequire('./layout/LayoutFactory');
		return jsg.layoutFactory;
	}
	static set layoutFactory(val) {
		jsg.layoutFactory = val;
	}

	static get propertyEventsDisabled() {
		return jsg.propertyEventsDisabled;
	}
	static set propertyEventsDisabled(val) {
		jsg.propertyEventsDisabled = val;
	}

	static setPropertyEventsDisabled(val) {
		jsg.propertyEventsDisabled = val;
	}

	/**
	 * The parser used by the framework.<br/>
	 * If full control over the parsing process is required custom applications can inherit from <code>GraphParser</code>
	 * and replace this property with a custom parser implementation.
	 *
	 * @property GraphParser
	 * @type {GraphParser}
	 * @static
	 */
	static get FormulaParser() {
		return getOrCreate('FormulaParser', './graph/parser/GraphParser');
	}
	static set FormulaParser(val) {
		jsg.FormulaParser = val;
	}

	/**
	 * Only for internal usage!! Do not use!
	 * @method isGroup
	 * @param {GraphItem} item GraphItem to check.
	 * @return {Boolean}
	 * @static
	 * @deprecated DON'T USE!! SUBJECT TO REMOVE!!
	 */
	static isGroup(item) {
		// eslint-disable-next-line
		const Group = require('./graph/model/Group');
		// instanceof cannot deal with undefined!!
		return Group && item instanceof Group;
	}

	static getLocalizedString(str) {
		return str;
	}
}

/**
 * Predefined mode constants to specify the display behavior for a scrollbar.</br>
 * See {{#crossLink "ScrollBar/setMode:method"}}{{/crossLink}} too.
 */
JSG.ScrollBarMode = {
	/**
	 * Specifies auto behavior, i.e. that the scrollbar is automatically shown or hidden if required.
	 *
	 * @property AUTO
	 * @type {Number}
	 * @static
	 */
	AUTO: 0,
	/**
	 * Specifies that the srollbar is always visible.
	 *
	 * @property VISIBLE
	 * @type {Number}
	 * @static
	 */
	VISIBLE: 1,
	/**
	 * Specifies that the srollbar is always hidden.
	 *
	 * @property HIDDEN
	 * @type {Number}
	 * @static
	 */
	HIDDEN: 2,
	/**
	 * Specifies that the srollbar is replaced by a simple placeholder.
	 *
	 * @property
	 * @type {Number}
	 * @static
	 */
	PLACEHOLDER: 3
};

JSG.debug = {
	_isActive: false,
	SHOW_BBOX_POINTS: false,
	SHOW_LINE_BBOX: false,
	SHOW_LINE_ORIGIN: false,
	DUMP_ITEM_ID: false,
	DUMP_IDUPDATER: false,
	DRAW_ITEM_PORTS: false,
	DRAW_ITEM_CENTER: false,
	DUMP_CACHE_COUNTS: false,
	DUMP_CACHE_SIZE: false,
	LOG_CACHE_WARNINGS: false,

	log(message, flag = this._isActive) {
		if (flag === true) ConsoleLogger.log(message);
	},
	logError(message, err) {
		if (message) ConsoleLogger.log(message);
		if (err) ConsoleLogger.log(`Reason: ${err.toString()}`);
	},
	info(message) {
		if (this._isActive) ConsoleLogger.info(message);
	}
};

JSG.theme = {
	theme: 'Default',
	chart: 'basic',
	graph: '#DDDDDD',
	tool: '#EEEEEE',
	caption: '#1565c0',
	captiontext: '#FFFFFF',
	frame: '#AAAAAA',
	splitter: '#CFD8DC',
	header: '#F2F2F2',
	headertext: '#333333',
	outline: '#777777',
	sheet: '#FFFFFF',
	grid: '#CCCCCC',
	border: '#000000',
	text: '#000000',
	textlight: '#222222',
	fill: '#FFFFFF',
	filllight: '#F1F1F1',
	feedbackFill: 'rgba(0,0,0,0.2)',
	feedbackBorder: 'rgba(0,0,0,0.8)',
};

module.exports = JSG;
