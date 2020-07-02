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
/* global document window navigator XMLHttpRequest */

/**
 * @module JSG
 * @namespace JSG
 */
import {
	default as JSG,
	Notification,
	NotificationCenter,
	MetricCoordinateSystem,
	ImagePool,
	Point,
} from '@cedalo/jsg-core';
import { Locale } from '@cedalo/parser';

import Tooltip from './graph/interaction/Tooltip';
import ScalableGraphics from './ui/graphics/ScalableGraphics';
import Cursor from './ui/Cursor';

JSG.touchDevice = !!('ontouchstart' in window) || !!('msmaxtouchpoints' in window.navigator);

// Browser detection....
JSG.isFF = (typeof InstallTrigger !== 'undefined');
const isIE = false || !!document.documentMode;
// Edge 20+
const isEdge = !isIE && !!window.StyleMedia;

JSG.browserVersion = () => {
	const ua = navigator.userAgent;
	let tem;
	// eslint-disable-next-line
	let M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || [];

	if (/trident/i.test(M[1])) {
		tem = /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
		return `IE ${tem[1] || ''}`;
	}
	M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
	// eslint-disable-next-line
	if ((tem = ua.match(/version\/([\.\d]+)/i)) !== null) {
		M[2] = tem[1];
	}
	return M;
};
JSG.isSafari = JSG.browserVersion()[0] && JSG.browserVersion()[0].toLowerCase() === 'safari';
JSG.isMobileSafari = JSG.touchDevice && JSG.isSafari;


JSG.canvasSupported = !!window.HTMLCanvasElement;

JSG.bkColorHeader = '#F3F3F3';
JSG.bkColorScroll = '#F3F3F3';
JSG.bkColorButton = '#CCCCCC';

JSG.findRadius = JSG.touchDevice ? 600 : 300;
JSG.scaledFindRadius = JSG.touchDevice ? 600 : 300;
JSG.portFindRadius = JSG.touchDevice ? 400 : 200;
JSG.createThreshhold = 300;
JSG.snapRadius = 300;
JSG.keepFocus = false;
JSG.canvasCache = true;
JSG.feedbackOptions = {
	position: true,
	angle: true,
	size: true,
	edges: true
};
JSG.zoomMarkChanged = true;

JSG.colors = ['FFFFFF', '000000', '222222', '444444', '666666', '888888', 'AAAAAA', 'CCCCCC', 'EEEEEE', '660000',
	'663300', '996633', '003300', '003333', '003399', '000066', '330066', '660066', '990000', '993300', 'CC9900',
	'006600', '336666', '0033FF', '000099', '660099', '990066', 'CC0000', 'CC3300', 'FFCC00', '009900', '006666',
	'0066FF', '0000CC', '663399', 'CC0099', 'FF0000', 'FF3300', 'FFFF00', '00CC00', '009999', '0099FF', '0000FF',
	'9900CC', 'FF0099', 'CC3333', 'FF6600', 'FFFF33', '00FF00', '00CCCC', '00CCFF', '3366FF', '9933FF', 'FF00FF',
	'FF6666', 'FF6633', 'FFFF66', '66FF66', '66CCCC', '00FFFF', '3399FF', '9966FF', 'FF66FF', 'FF9999', 'FF9966',
	'FFFF99', '99FF99', '66FFCC', '99FFFF', '66CCFF', '9999FF', 'FF99FF', 'FFCCCC', 'FFCC99', 'FFFFCC', 'CCFFCC',
	'99FFCC', 'CCFFFF', '99CCFF', 'CCCCFF', 'FFCCFF'];

JSG.toolTip = new Tooltip();

/**
 * Factory to provide and register different {{#crossLink "Layout"}}{{/crossLink}}s.
 *
 * @property layoutFactory
 * @type {LayoutFactory}
 * @static
 * @since 1.6.18
 */
// JSG.layoutFactory = undefined;

JSG.defaultEdgeType = 'edge';

/**
 * Property used to measure text.<br/>
 * <b>Note:</b> before using this property the library must be have been initialized by calling
 * {{#crossLink "JSG/init:method"}}{{/crossLink}}.
 *
 * @property graphics
 * @type {ScalableGraphics}
 * @static
 */
JSG.graphics = undefined;

/**
 * To turn drawing off or on. Useful to prevent too many drawing operations. Use with care.
 * @property drawingDisabled
 * @type {Boolean}
 * @static
 */
JSG.drawingDisabled = false;

/**
 * Notification flag. This notification is send via NotificationCenter whenever the drawing is
 * globally enabled or disabled.
 *
 * See {{#crossLink "NotificationCenter"}}{{/crossLink}}.
 * @property DRAW_DISABLED_NOTIFICATION
 * @type String
 * @static
 */
JSG.DRAW_DISABLED_NOTIFICATION = 'jsg.draw.disabled.notification';
JSG.LOCALE_CHANGED_NOTIFICATION = 'jsg.locale.changed.notification';

/**
 * Localized strings.
 * @property _localizedStrings
 * @type Object
 * @private
 * @static
 */
JSG._localizedStrings = {};

JSG.setDrawingDisabled = (status) => {
	if (status !== JSG.drawingDisabled) {
		JSG.drawingDisabled = status;
		NotificationCenter.getInstance().send(new Notification(JSG.DRAW_DISABLED_NOTIFICATION, this));
	}
};

JSG.copyItems = (selection) => {
	const file = new JSG.JSONWriter();
	const items = selection.length === undefined ? [selection] : selection;
	const graphItems = items[0].getModel().getParent().getItems();

	// sort items first, so drawing order of copied items does not change
	items.sort((a, b) => {
		const ia = graphItems.indexOf(a.getModel());
		const ib = graphItems.indexOf(b.getModel());
		return ia < ib ? -1 : 1
	});

	file.writeStartDocument();
	file.writeStartElement('clip');
	file.writeStartArray('graphitem');

	items.forEach((sel) => {
		sel.getModel().resolveParentReferences(true);
		sel.getModel().save(file, true);
	});

	file.writeEndArray('graphitem');
	file.writeEndElement();
	file.writeEndDocument();

	// this.debug.log(file.flush());

	return file.flush();
};

/**
 * Initialize the library. Must be called before first usage. <br/>
 * As optional parameter a locale string can be specified to load string localizations from the resource directory
 * <code>res/i18n</code>. The expected locale string is simply the file name without its extension. E.g. to load the
 * german localization simply pass <code>de-de</code> as second parameter.
 *
 * @method init
 * @param {String} jsghome A string which reference the directory where jsg.js is located and loaded from
 * @param {String} [locale] An optional locale string to load different localizations.
 * @static
 */
JSG.init = (jsghome, locale) => {
	JSG.home = jsghome;
	JSG.locale = locale;

	// init some static properties:
	JSG.dpi = (() => {
		const tmpDiv = document.createElement('div');
		tmpDiv.setAttribute('id', 'TestDiv');
		tmpDiv.setAttribute('style', 'height: 1in; left: -100%; position: absolute; top: -100%; width: 1in;');
		document.body.appendChild(tmpDiv);
		const dpi = new Point(tmpDiv.offsetWidth, tmpDiv.offsetHeight);
		document.body.removeChild(tmpDiv);
		return dpi;
	})();
	JSG.graphics = new ScalableGraphics(document.createElement('canvas'), new MetricCoordinateSystem());

	// JSG images => TODO we need something better...
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_NOTAVAIL}.png`,
		ImagePool.IMG_NOTAVAIL
	);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_EXPANDED}.png`,
		ImagePool.IMG_EXPANDED
	);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_COLLAPSED}.png`,
		ImagePool.IMG_COLLAPSED
	);

	JSG.imagePool.add(`${jsghome}/res/images/${ImagePool.IMG_BOLD}.png`, ImagePool.IMG_BOLD);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_ITALIC}.png`,
		ImagePool.IMG_ITALIC
	);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_UNDERLINE}.png`,
		ImagePool.IMG_UNDERLINE
	);

	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_LEFT_ALIGN}.png`,
		ImagePool.IMG_LEFT_ALIGN
	);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_CENTER_ALIGN}.png`,
		ImagePool.IMG_CENTER_ALIGN
	);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_RIGHT_ALIGN}.png`,
		ImagePool.IMG_RIGHT_ALIGN
	);

	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_FONTCOLOR}.png`,
		ImagePool.IMG_FONTCOLOR
	);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_FONTSIZE_UP}.png`,
		ImagePool.IMG_FONTSIZE_UP
	);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_FONTSIZE_DOWN}.png`,
		ImagePool.IMG_FONTSIZE_DOWN
	);

	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_BULLETS}.png`,
		ImagePool.IMG_BULLETS
	);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_NUMBERED}.png`,
		ImagePool.IMG_NUMBERED
	);

	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_TREE_CHECKED}.png`,
		ImagePool.IMG_TREE_CHECKED
	);
	JSG.imagePool.add(
		`${jsghome}/res/images/${ImagePool.IMG_TREE_UNCHECKED}.png`,
		ImagePool.IMG_TREE_UNCHECKED
	);

	// load SVGs
	// JSG.imagePool.add(jsghome + "/res/svg/delete_24px.svg", 'md_delete_forever');
	JSG.imagePool.add(`${jsghome}/res/svg/${ImagePool.SVG_DELETE}.svg`, ImagePool.SVG_DELETE);
	JSG.imagePool.add(
		`${jsghome}/res/svg/${ImagePool.SVG_CREATE_EDGE}.svg`,
		ImagePool.SVG_CREATE_EDGE
	);
	JSG.imagePool.add(
		`${jsghome}/res/svg/${ImagePool.SVG_CREATE_HVEDGE}.svg`,
		ImagePool.SVG_CREATE_HVEDGE
	);
	JSG.imagePool.add(`${jsghome}/res/svg/${ImagePool.SVG_MOVE_UP}.svg`, ImagePool.SVG_MOVE_UP);
	JSG.imagePool.add(
		`${jsghome}/res/svg/${ImagePool.SVG_MOVE_DOWN}.svg`,
		ImagePool.SVG_MOVE_DOWN
	);
	JSG.imagePool.add(
		`${jsghome}/res/svg/${ImagePool.SVG_MOVE_LEFT}.svg`,
		ImagePool.SVG_MOVE_LEFT
	);
	JSG.imagePool.add(
		`${jsghome}/res/svg/${ImagePool.SVG_MOVE_RIGHT}.svg`,
		ImagePool.SVG_MOVE_RIGHT
	);
	JSG.imagePool.add(
		`${jsghome}/res/svg/${ImagePool.SVG_FILTER}.svg`,
		ImagePool.SVG_FILTER
	);
	JSG.imagePool.add(
		`${jsghome}/res/svg/${ImagePool.SVG_CHECKED}.svg`,
		ImagePool.SVG_CHECKED
	);
	JSG.imagePool.add(
		`${jsghome}/res/svg/${ImagePool.SVG_UNCHECKED}.svg`,
		ImagePool.SVG_UNCHECKED
	);


	if (isIE || isEdge) {
		Cursor.Style.CROSS = `url(${jsghome}/res/cross.cur), crosshair`;
		Cursor.Style.ROTATE = `url(${jsghome}/res/rotate.cur), move`;
		Cursor.Style.SHEET = `url(${jsghome}/res/sheet.cur), move`;
		Cursor.Style.SHEETROW = `url(${jsghome}/res/sheetrow.cur), move`;
		Cursor.Style.SHEETCOLUMN = `url(${jsghome}/res/sheetcolumn.cur), move`;
		Cursor.Style.SHEETROWSIZE = `url(${jsghome}/res/rowsize.cur), move`;
		Cursor.Style.SHEETCOLUMNSIZE = `url(${jsghome}/res/columnsize.cur), move`;
		Cursor.Style.DENY = `url(${jsghome}/res/deny.cur), auto`;
		Cursor.Style.SPLITV = `url(${jsghome}/res/splitv.cur), move`;
		Cursor.Style.SPLITH = `url(${jsghome}/res/splith.cur), move`;
		Cursor.Style.FORMATPAINT = 'copy'; // TODO "url(" + jsghome + "/res/formatpainter.cur), copy";
	} else {
		Cursor.Style.CROSS = `url("${jsghome}/res/cross.png") 15 15, crosshair`;
		Cursor.Style.ROTATE = `url("${jsghome}/res/rotate.png") 15 15, move`;
		Cursor.Style.SHEET = `url("${jsghome}/res/sheet.png") 15 15, move`;
		Cursor.Style.SHEETROW = `url("${jsghome}/res/sheetrow.png") 15 15, move`;
		Cursor.Style.SHEETCOLUMN = `url("${jsghome}/res/sheetcolumn.png") 15 15, move`;
		Cursor.Style.SHEETROWSIZE = `url("${jsghome}/res/rowsize.png") 15 15, move`;
		Cursor.Style.SHEETCOLUMNSIZE = `url("${jsghome}/res/columnsize.png") 15 15, move`;
		Cursor.Style.DENY = `url("${jsghome}/res/deny.png") 15 15, auto`;
		Cursor.Style.SPLITV = `url("${jsghome}/res/splitv.png") 15 15, move`;
		Cursor.Style.SPLITH = `url("${jsghome}/res/splith.png") 15 15, move`;
		Cursor.Style.FORMATPAINT = 'copy'; // TODO "url(" + jsghome + "/res/formatpainter.png) 15 15, copy";
	}
	// JSG.layoutFactory = LayoutFactory;

	JSG.setLocale(locale);
	// load our css...
	JSG.loadCSS(`${jsghome}/res/css/jsg.css`);
};

JSG.setParserLocale = (locale) => {
	JSG.parserLocale = locale;
};

JSG.getParserLocale = () => (JSG.parserLocale ? JSG.parserLocale : 'en');

JSG.getParserLocaleSettings = () => {
	switch (JSG.parserLocale) {
	case 'de':
		return Locale.DE;
	case 'en':
	default:
		return Locale.EN;
	}
};


JSG.setLocale = (locale, finish) => {
	if (locale) {
		const xhr = JSG._createRequest(`${JSG.home}/res/i18n/${locale.toLowerCase()}.json`, {
			onload(response) {
				JSG._localizedStrings = JSON.parse(response);
				NotificationCenter.getInstance().send(new Notification(JSG.LOCALE_CHANGED_NOTIFICATION, this));
				if (finish) {
					finish();
				}
			},
			onerror() {
				JSG.debug.logError(`Failed to load ${locale}.json`);
			}
		});
		xhr.send();
	}
	JSG.locale = locale;
};

/**
 * Helper method to init specified icon fonts.
 * Can probably fix drawing problem on first usage of given fonts.
 * @method initIconFont
 * @param {String*} names A comma separated list of font family names.
 */
JSG.initIconFont = (...args) => {
	const ctxt = JSG.graphics && JSG.graphics.getContext();
	if (ctxt) {
		let i;
		const n = args.length;

		for (i = 0; i < n; i += 1) {
			// console.log("init "+name);
			ctxt.font = `0pt ${args[i]}`;
			ctxt.fillText('\u0000', 0, 0);
		}
	}
};

/**
 * Creates a new XMLHttpRequest for given url.<br/>
 * Note: this is currently API internal...
 *
 * @method _createRequest
 * @param {String} url The URL to request
 * @param {String} [callback] An optional callback object <code>{onload:Function, onerror:Function}</code>
 * @return {XMLHttpRequest} A new XMLHttpRequest object
 * @private
 */
JSG._createRequest = (url, callback) => {
	const xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.onload = (ev) => {
		if (callback && callback.onload) {
			callback.onload.call(callback, xhr.response);
		}
	};
	xhr.onerror = (ev) => {
		if (callback && callback.onerror) {
			callback.onerror.call(callback);
		}
	};
	xhr.onabort = (ev) => {
		if (callback && callback.onerror) {
			callback.onerror.call(callback);
		}
	};
	return xhr;
};
/**
 * Currently <b>API INTERNAL!!</b>
 * @method loadCSS
 * @param {String} url The url of the CSS file to load. Should be relative to <code>JSG.home</code>.
 * @param {Function} callback Optional function which gets called if CSS file was loaded or loading failed...
 */
JSG.loadCSS = (url, callback) => {
	function notifyCallback(err) {
		if (callback) {
			callback(err);
		}
	}

	const link = document.createElement('link');
	link.href = url;
	link.rel = 'stylesheet';
	link.type = 'text/css';
	if (link.readyState) { // IE
		link.onreadystatechange = () => {
			if (link.readyState === 'complete' || link.readyState === 'loaded') {
				link.onreadystatechange = null;
				notifyCallback();
			}
		};
	} else { // Others
		link.onload = () => {
			notifyCallback();
		};
		link.onerror = (ev) => {
			notifyCallback({ cause: 'failed', url, event: ev });
		};
	}
	document.head.appendChild(link);
};
/**
 * Currently <b>API INTERNAL!!</b>
 * @method isStyleAvailable
 * @param {String} selector A CSS style selector string, e.g.: <code>".my-css-selector"</code>.
 */
JSG.isStyleAvailable = (selector) => {
	const stylelist = document.styleSheets;
	return [].slice.call(stylelist).some((styleSheet) => {
		if (styleSheet.cssRules) {
			return [].slice.call(styleSheet.cssRules).some(cssRule => cssRule.selectorText.indexOf(selector) > -1);
		}
		return undefined;
	});
};
/**
 * Returns localized version of given string or the string itself if no localizations exists.<br/>
 * The translated strings are read from JSON files under <code>/res/i18n/</code>.
 * @method getLocalizedString
 * @param {String} str The string to localize.
 * @return {String} The localized string.
 * @since 1.6.43
 */
JSG.getLocalizedString = str => JSG._localizedStrings[str] || str;

export default JSG;
