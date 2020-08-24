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
/* global document */

import {
	default as JSG,
	Notification,
	NotificationCenter,
	Event,
	Strings,
	GraphUtils,
	GraphSettings,
	Point,
	Rectangle,
	MetricCoordinateSystem,
} from '@cedalo/jsg-core';

import GraphicSystem from './graphics/GraphicSystem';
import ScrollableViewer from './viewer/ScrollableViewer';
import GraphControllerFactory from '../graph/controller/GraphControllerFactory';
import InteractionHandler from '../graph/interaction/InteractionHandler';
import ReadOnlyInteraction from '../graph/interaction/ReadOnlyInteraction';
import GraphInteraction from '../graph/interaction/GraphInteraction';
import ItemMenuHandler from './menu/ItemMenuHandler';

//= =================================================================================================
// INNER CLASS as an example of a custom graph listener...
//
/**
 * A simple listener to check for {{#crossLink "Graph"}}{{/crossLink}} changes of type
 * {{#crossLink "Event/BBOX:property"}}{{/crossLink}} or
 * {{#crossLink "GraphSettings.SettingID:property"}}{{/crossLink}}.
 *
 * @class GraphListener
 * @extends EventListener
 * @param {GraphEditor} editor The GraphEditor instance which uses this object as settings listener.
 * @constructor
 */
class GraphListener /* extends EventListener */ {
	constructor(editor) {
		// super();
		this._editor = editor;
		this._lastSize = new Point(0, 0);
	}

	handlePreEvent(event) {}

	handlePostEvent(event) {
		const ID = GraphSettings.SettingID;
		switch (event.detailId) {
			case ID.SCALEVISIBLE:
				this._editor.showScale(event.value);
				break;
		}

		const EventID = Event;
		switch (event.id) {
			case EventID.BBOX:
				this._handleResize();
				break;
		}
	}

	_handleResize() {
		let scroll = false;
		const graph = this._editor.getGraph();
		const bounds = this._editor.getVisibleViewRect(JSG.rectCache.get());
		const graphbounds = this._getGraphBounds(graph, JSG.rectCache.get());

		const pt = JSG.ptCache.get();
		const index = JSG.ptCache.get();
		const offset = JSG.ptCache.get();
		const viewer = this._editor.getGraphViewer();
		const scrollpos = viewer.getScrollPanel().getScrollPosition(JSG.ptCache.get());

		if (graphbounds.getRight() < bounds.x) {
			scroll = true;
			pt.x = graphbounds.getRight();
			pt.x -= bounds.width;
		} else if (graphbounds.x > bounds.getRight()) {
			scroll = true;
			pt.x = graphbounds.x;
		} else {
			pt.x = scrollpos.x;
		}
		if (graphbounds.getBottom() < bounds.y) {
			scroll = true;
			pt.y = graphbounds.getBottom();
			pt.y -= bounds.height;
		} else if (graphbounds.y > bounds.getBottom()) {
			scroll = true;
			pt.y = graphbounds.y;
		} else {
			pt.y = scrollpos.y;
		}
		if (scroll) {
			this._editor.setScrollPosition(pt.x, pt.y);
			this._editor._updateLayout();
		}
		JSG.ptCache.release(pt, index, offset, scrollpos);
		JSG.rectCache.release(bounds, graphbounds);
	}

	_getGraphBounds(graph, reuserect) {
		const bbox = graph.getBoundingBox(JSG.boxCache.get());
		const rect = bbox.toRectangle(reuserect);
		JSG.boxCache.release(bbox);
		return rect;
	}
}

/**
 * The <code>GraphEditor</code> connects default instances of a {{#crossLink
 * "CoordinateSystem"}}{{/crossLink}}, a {{#crossLink "GraphicSystem"}}{{/crossLink}}
 * and a {{#crossLink "GraphViewer"}}{{/crossLink}} to visualize arbitrary {{#crossLink
 * "Graph"}}{{/crossLink}} models. To support graph {{#crossLink
 * "Interaction"}}{{/crossLink}}s an {{#crossLink
 * "InteractionHandler"}}{{/crossLink}} is used too.</br> So to set up this environment the
 * editor basically does the following:
 *
 *    var cs = new MetricCoordinateSystem();
 *    var graphicSystem = new GraphicSystem(canvas, cs);
 *    var graphViewer = new ScrollableViewer(graphicSystem);
 *    graphViewer.setControllerFactory(GraphControllerFactory.getInstance());
 *    var interactionHandler = new InteractionHandler(graphViewer);
 *    graphicSystem.setContent(graphViewer.getRootView());
 *    graphicSystem.setInteractionHandler(interactionHandler);
 *
 * The <code>CoordinateSystem</code> is required to transform between the browser coordinate system and the logical
 * coordinate system of the graph. While a <code>GraphViewer</code> is responsible for displaying a graph model the
 * <code>GraphicSystem</code> together with the <code>InteractionHandler</code> takes care of dispatching events to
 * registered interactions. Note: only a single interaction must
 * and can be active at a time, i.e. the active interaction will receive all events. If no interaction is explicitly
 * set
 * as active a default interaction is activated which is provided by {{#crossLink
 * "ControllerViewer/getDefaultInteraction:method"}}{{/crossLink}}. Usually a default interaction is an
 * instance of {{#crossLink "InteractionDispatcher"}}{{/crossLink}} which receives the events and
 * dispatches them to registered interactions.</br> On top of this interaction mechanism the editor supports the
 * registration of different default interactions for different view modes. A typical example for this is to support a
 * general edit mode and a restricted read-only mode. Therefore it is possible to change the editor behavior with
 * different default interactions depending on current active mode. The framework defines two view modes namely a
 * {{#crossLink "GraphSettings.ViewMode/DEFAULT:property"}}{{/crossLink}} and a {{#crossLink
 * "GraphSettings.ViewMode/READ_ONLY:property"}}{{/crossLink}} mode with their corresponding interactions
 * {{#crossLink "GraphInteraction"}}{{/crossLink}} and {{#crossLink
 * "ReadOnlyInteraction"}}{{/crossLink}} respectively. However custom applications can replace
 * these or simply register their own default interactions for their own custom modes. E.g.
 *
 *    var VIEWMODE = GraphSettings.ViewMode;
 *    myEditor.registerInteractionForMode(VIEWMODE.DEFAULT, new CustomDefaultInteraction());
 *    myEditor.registerInteractionForMode(VIEWMODE.READ_ONLY, new CustomReadOnlyInteraction());
 *    myEditor.registerInteractionForMode("custom.mode.id", new CustomModeInteraction());
 *
 * To switch between different view modes simply call {{#crossLink
 * "GraphEditor/activateViewMode:method"}}{{/crossLink}} with the identifier of the view mode to activate.</br>
 * </br>
 * The editor supports the export of a graph model to <code>XML</code> or to the <code>SVG</code> format. To export a
 * graph to <code>SVG</code> use {{#crossLink "GraphEditor/saveSVG:method"}}{{/crossLink}} or
 * {{#crossLink "GraphEditor/saveSVGPage:method"}}{{/crossLink}}. To export the graph to <code>XML</code> simply
 * call {{#crossLink "GraphEditor/save:method"}}{{/crossLink}}. The created stream can be imported
 * again via {{#crossLink "GraphEditor/read:method"}}{{/crossLink}}. So to load a graph model from
 * <code>XML</code> simply set an empty graph instance and call <code>readXML</code> afterwards, e.g. like this:
 *
 *    editor.setGraph(new Graph());
 *    editor.readXML(xmldoc);
 *
 * Finally, if the editor is no longer needed {{#crossLink "GraphEditor/destroy:method"}}{{/crossLink}} should
 * be
 * called to free used resources.
 *
 * @class GraphEditor
 * @constructor
 * @param {canvas | String} canvasArg Id of the canvas element to be used or the canvas element itself.
 */
class GraphEditor {
	constructor(canvasArg) {
		const cs = new MetricCoordinateSystem();
		const canvas = Strings.isString(canvasArg)
			? document.getElementById(canvasArg)
			: canvasArg;

		this._canvasId = canvas.id;

		canvas._jsgEditor = this;
		this._graphListener = new GraphListener(this);

		// use metric system as default:
		this._graphicSystem = new GraphicSystem(canvasArg, cs);
		this._graphViewer = this.createViewer(this._graphicSystem);
		this._interactionHandler = new InteractionHandler(this._graphViewer);
		this._graphicSystem.setContent(this._graphViewer.getRootView());
		this._graphicSystem.setInteractionHandler(this._interactionHandler);

		// to support the invalidation of a graph for delayed loading of images
		JSG.imagePool.registerEditor(this);
		JSG.layoutFactory.registerEditor(this);

		this._menuhandler = undefined;

		// view modes:
		this._viewmodes = {};
		// predefined default interactions:
		this._viewmodes[
			GraphSettings.ViewMode.DEFAULT
		] = new GraphInteraction();
		this._viewmodes[
			GraphSettings.ViewMode.READ_ONLY
		] = new ReadOnlyInteraction();
		this.activateViewMode(GraphSettings.ViewMode.DEFAULT);
	}

	/**
	 * Creates a ScrollableViewer to use for displaying a graph model.</br>
	 * This method can be overwritten by subclasses in order to provide custom viewers. Since this GraphEditor supports
	 * scrolling the returned viewer must conform to a ScrollableViewer.
	 *
	 * @method createViewer
	 * @param {GraphicSystem} graphicSystem The GraphicSystem to use for drawing and event handling.
	 * @return {ScrollableViewer} A new ScrollableViewer instance.
	 */
	createViewer(graphicSystem) {
		const viewer = new ScrollableViewer(graphicSystem);
		viewer.setControllerFactory(GraphControllerFactory.getInstance());
		return viewer;
	}

	/**
	 * Saves the currently displayed graph using the given writer.</br>
	 *
	 * @method save
	 * @param {Writer} writer Writer to use.
	 * @return {String} Stream representation of displayed graph.
	 */
	save(file) {
		file.writeStartDocument();

		file.writeStartElement('document');
		file.writeAttributeString('version', '1.0.0');
		file.writeAttributeNumber('zoom', this.getZoom(), 3);

		this.getGraph().save(file);

		// save all data uri images to restore them
		file.writeStartElement('images');

		GraphUtils.traverseItem(this.getGraph(), (item) => {
			const pattern = item
				.getFormat()
				.getPattern()
				.getValue();
			if (pattern.indexOf('dataimage') !== -1) {
				file.writeStartElement(pattern);
				const image = JSG.imagePool.get(pattern);
				if (image !== undefined) {
					file.writeStartElement('data');
					file.writeString(image.src);
					file.writeEndElement();
				}
				file.writeEndElement();
			}
		});

		file.writeEndElement();

		file.writeEndElement();

		file.writeEndDocument();

		return file.flush();
	}

	getGraphData(reader) {
		const data = reader.getObject(reader.getDocument(), 'graphitem');
		if (data) {
			const type = reader.getAttribute(data, 'type');
			return type === 'graph' ? data : undefined;
		}

		return undefined;
	}

	/**
	 * Reads the given stream and displays the corresponding graph.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading depending on stream content.
	 */
	read(reader) {
		const graph = this.getGraph();
		const graphData = this.getGraphData(reader);
		if (graphData) {
			this._preRead(reader, graph);
			graph.read(reader, graphData);
			this._postRead(graph);
		}
	}

	_preRead(reader, graph) {
		JSG.setDrawingDisabled(true);
		graph.getSettings().reset();
		this.clear();
		if (this.jsgShape) {
			this.setDisplayMode(GraphSettings.DisplayMode.ENDLESS);
		}
		this._readImages(reader);
		this._readDocSettings(reader);
	}

	_readImages(reader) {
		// read data uri images first

		const images = reader.getObject(reader.getDocument(), 'images');
		if (images === undefined) {
			return;
		}

		reader.iterateObjects(images, (name, child) => {
			const image = reader.getObject(child, 'data');
			if (image !== undefined) {
				const dataURI = reader.getString(image);
				if (dataURI) {
					JSG.imagePool.add(dataURI, name);
				}
			}
		});
		// var i, n;
		// var node = xmldoc.getElementsByTagName('images')[0];
		// if (node && node.hasChildNodes()) {
		//     for ( i = 0, n = node.childNodes.length; i < n; i++) {
		//         var imageNode = node.childNodes[i];
		//         if (imageNode && imageNode.nodeType === 1) {
		//             var dataURI = imageNode.childNodes[1].textContent;
		//             if (dataURI) {
		//                 JSG.imagePool.add(dataURI, imageNode.nodeName);
		//             }
		//         }
		//     }
		// }
	}

	_readDocSettings(reader) {
		const zoom = reader.getAttribute(reader.getDocument(), 'zoom');
		if (zoom !== undefined) {
			this.setZoom(Number(zoom));
		}
	}

	_postRead(graph) {
		// moved to graph
		// graph._restoreConnections(graph);
		// graph.invalidateTerms();
		// graph.evaluate();
		// graph.refresh();
		this.layout();
		this.activateViewMode(graph.getSettings().getViewMode(), true);
		JSG.setDrawingDisabled(false);
	}

	/**
	 * Defines default XML options used on SVG creation.</br>
	 * See {{#crossLink "GraphEditor/saveSVG:method"}}{{/crossLink}} and
	 * {{#crossLink "GraphEditor/saveSVGPage:method"}}{{/crossLink}}. </br>
	 * Currently following properties are supported
	 * <ul>
	 *     <li>prolog - An XML prolog string: <?xml version="1.0".... ?> </li>
	 *     <li>dtd - A document type definition string: <!DOCTYPE ... > </li>
	 *     <li>svg - An object which specifies key-value pairs of SVG attributes to add to the
	 *     SVG header definition. </li>
	 * </ul>
	 *
	 * @method getSvgXmlOptions
	 * @param {Rectangle} [rect] Optional rectangle in logical coordinates. Used to define the SVG viewbox.
	 * If not given <code>(0, 0, 0, 0)</code> is used.
	 * @param {Function} [callback] Optional callback function which is called with default XML-SVG options object. This
	 * function can be used to adjust XML-SVG options to use.
	 * @return {Object} An object which specifies XML and SVG settings.
	 * @since 3.0.0
	 */
	getSvgXmlOptions(rect, callback) {
		rect = rect || { x: 0, y: 0, width: 0, height: 0 };
		const cs = new MetricCoordinateSystem();
		const xmlopts = {
			dtd: undefined,
			prolog: '<?xml version="1.0" encoding="UTF-8" ?>',
			svg: {
				width: `${rect.width / 100}mm`,
				height: `${rect.height / 100}mm`,
				viewBox: `${cs.toSVGUnit(rect.x)} ${cs.toSVGUnit(
					rect.y
				)} ${cs.toSVGUnit(rect.width)} ${cs.toSVGUnit(rect.height)}`,
				xmlns: 'http://www.w3.org/2000/svg',
				'xmlns:xlink': 'http://www.w3.org/1999/xlink'
			}
		};
		if (callback) {
			callback(xmlopts);
		}
		return xmlopts;
	}

	savePNG(width, height) {
		const canvas = document.createElement('canvas');
		const graph = this.getGraph();

		if (width <= 0 || height <= 0) {
			return undefined;
		}

		canvas.id = 'canvaspng';
		canvas.width = width;
		canvas.height = height;

		const editor = new GraphEditor(canvas);

		editor.setGraph(this.getGraph());

		const rect = graph.getUsedRect();
		const cs = this.getCoordinateSystem();

		rect.expandBy(100);

		// apply min size 1x1 cm
		rect.width = Math.max(1000, rect.width);
		rect.height = Math.max(1000, rect.height);

		const zoom = Math.min(
			cs.deviceToLogXNoZoom(width) / rect.width,
			cs.deviceToLogYNoZoom(height) / rect.height
		);

		editor.setZoom(zoom);

		const graphics = editor.getGraphicSystem().getGraphics();
		const view = editor.getGraphViewer().getGraphView();

		graphics._context2D.fillStyle = '#FFFFFF';
		graphics._context2D.fillRect(0, 0, canvas.width, canvas.height);
		graphics.translate(-rect.x, -rect.y);

		view.drawSubViews(
			graphics,
			new Rectangle(rect.x, rect.y, rect.width, rect.height)
		);

		const image = canvas.toDataURL();

		editor.destroy();

		return image;
	}

	/**
	 * Removes all sub-items of currently displayed graph.
	 *
	 * @method clear
	 */
	clear() {
		const graph = this.getGraph();
		let i;

		for (i = graph._subItems.length - 1; i >= 0; i -= 1) {
			graph.removeItem(graph._subItems[i]);
		}
		this._graphicSystem.paint();
	}

	/**
	 * Returns the ID of internally used canvas element.
	 *
	 * @method getCanvasId
	 * @return {String} The canvas ID.
	 */
	getCanvasId() {
		return this._canvasId;
	}

	/**
	 * Returns the GraphicSystem which is used for drawing and event handling.
	 *
	 * @method getGraphicSystem
	 * @return {GraphicSystem} The used GraphicSystem.
	 */
	getGraphicSystem() {
		return this._graphicSystem;
	}

	/**
	 * Returns the default interaction of inner {{#crossLink "GraphViewer"}}{{/crossLink}}. This
	 * interaction depends on the currently active view mode.</br> See {{#crossLink
	 * "GraphEditor/activateViewMode:method"}}{{/crossLink}}.
	 *
	 * @method getDefaultInteraction
	 * @return {Interaction} The current default interaction.
	 */
	getDefaultInteraction() {
		return this._graphViewer.getDefaultInteraction();
	}

	/**
	 * Sets and activates the default interaction of inner graph viewer for {{#crossLink
	 * "GraphSettings.ViewMode/DEFAULT:property"}}{{/crossLink}} view mode. This replace any previously
	 * interaction for the same mode.
	 *
	 * @method setDefaultInteraction
	 * @param {Interaction} interaction The new default interaction to use.
	 * @deprecated Better use {{#crossLink "GraphEditor/activateViewMode:method"}}{{/crossLink}}!!
	 */
	setDefaultInteraction(interaction) {
		const mode = GraphSettings.ViewMode.DEFAULT;
		this._viewmodes[mode] = interaction;
		this.activateViewMode(mode, true);
		// ORG:
		// if (interaction !== undefined) {
		// this._graphViewer.setDefaultInteraction(interaction);
		// this._interactionHandler.setActiveInteraction(interaction);
		// }
	}

	/**
	 * Sets the new default Interaction which corresponds to given view mode identifier.<br/>
	 * The Interaction to be activated can be registered via {{#crossLink
	 * "GraphEditor/registerInteractionForMode:method"}}{{/crossLink}}. By default this GraphEditor has an
	 * instance of {{#crossLink "GraphInteraction"}}{{/crossLink}} registered for the
	 * {{#crossLink "GraphSettings.ViewMode/DEFAULT:property"}}{{/crossLink}} mode and an instance of
	 * {{#crossLink "ReadOnlyInteraction"}}{{/crossLink}} for the standard
	 * {{#crossLink "GraphSettings.ViewMode/READ_ONLY:property"}}{{/crossLink}} view mode.<br/>
	 *
	 * @method activateViewMode
	 * @param {String} mode A view mode identifier to activate.
	 * @param {Boolean} [force] Optional flag to force the mode activation.
	 * @return {String} The previously active mode or <code>undefined</code>.
	 */
	activateViewMode(mode, force) {
		const interaction = this.getInteractionForMode(mode);
		let previousmode;
		if (interaction) {
			// settings not always exist, e.g. ShapeLibrary...
			const settings = this.getGraphSettings();
			previousmode = settings ? settings.getViewMode() : undefined;
			if (previousmode !== mode || force) {
				this._graphViewer.clearAllOverlays();
				// set interaction...
				this._graphViewer.setDefaultInteraction(interaction);
				this._interactionHandler.setActiveInteraction(interaction);
				// ...and set view mode afterwards because interaction might simply copy old settings for restoring
				// reason:
				previousmode =
					settings && settings.setViewMode(mode)
						? previousmode
						: undefined;
			}
		}
		return previousmode;
	}

	/**
	 * Returns the Interaction to use for given view mode string.<br/>
	 * This method is called by {{#crossLink "GraphEditor/activateViewMode:method"}}{{/crossLink}} to set a new
	 * default interaction depending on given view mode. An interaction for a mode can be registered before via
	 * {{#crossLink "GraphEditor/registerInteractionForMode:method"}}{{/crossLink}}. If no interaction was
	 * registered for given mode the interaction for {{#crossLink
	 * "GraphSettings.ViewMode/DEFAULT:property"}}{{/crossLink}} is returned or an instance of {{#crossLink
	 * "GraphInteraction"}}{{/crossLink}} as last resort.<br/>
	 *
	 * @method getInteractionForMode
	 * @param {String} mode The view mode to get the Interaction for.
	 * @return {Interaction} The Interaction to set as new default interaction for given mode.
	 */
	getInteractionForMode(mode) {
		// do we have a registered interaction
		let interaction = this._viewmodes[mode];
		interaction =
			interaction ||
			this._viewmodes[GraphSettings.ViewMode.DEFAULT];
		return interaction || new GraphInteraction();
	}

	/**
	 * Registers an interaction for a specified view mode. This will replace any previously registered interaction for
	 * the same given mode. To activate registered interaction simply call {{#crossLink
	 * "GraphEditor/activateViewMode"}}{{/crossLink}}.</br> By default this GraphEditor has an instance of
	 * {{#crossLink "GraphInteraction"}}{{/crossLink}} registered for the {{#crossLink
	 * "GraphSettings.ViewMode/DEFAULT:property"}}{{/crossLink}} mode and an instance of {{#crossLink
	 * "ReadOnlyInteraction"}}{{/crossLink}} for the standard
	 * {{#crossLink "GraphSettings.ViewMode/READ_ONLY:property"}}{{/crossLink}} view mode.<br/>
	 *
	 * @method registerInteractionForMode
	 * @param {String} mode The view mode to set interaction for.
	 * @param {Interaction} interaction The interaction to use for given mode.
	 */
	registerInteractionForMode(mode, interaction) {
		this._viewmodes[mode] = interaction;
	}

	/**
	 * Convenience method to check if the view mode of registered {{#crossLink "Graph"}}{{/crossLink}}
	 * is equal to given mode.
	 *
	 * @method isInViewMode
	 * @param {String} mode The mode identifier to check.
	 * @return {Boolean} <code>true</code> if registered Graph has same view mode set, <code>false</code> otherwise.
	 */
	isInViewMode(mode) {
		const settings = this.getGraphSettings();
		return settings ? settings.getViewMode() === mode : false;
	}

	/**
	 * Returns the internally used InteractionHandler.
	 *
	 * @method getInteractionHandler
	 * @return {InteractionHandler} The internal InteractionHandler.
	 */
	getInteractionHandler() {
		return this._interactionHandler;
	}

	/**
	 * Sets a new InteractionHandler to use.</br>
	 * This can be used to replace default InteractionHandler with a custom one.
	 *
	 * @method setInteractionHandler
	 * @param {InteractionHandler} interactionHandler The new InteractionHandler to use.
	 */
	setInteractionHandler(interactionHandler) {
		if (interactionHandler) {
			this._interactionHandler = interactionHandler;
			this._interactionHandler.viewer = this._graphViewer;
			this._interactionHandler.setActiveInteraction(
				this._graphViewer.getDefaultInteraction()
			);
			this._graphicSystem.setInteractionHandler(this._interactionHandler);
		}
	}

	hasItemMenuHandler() {
		return !!this._menuhandler;
	}

	getItemMenuHandler() {
		if (!this._menuhandler) {
			this.setItemMenuHandler(new ItemMenuHandler());
		}
		return this._menuhandler;
	}

	// pass <code>undefined</code> to remove a previously added handler...
	setItemMenuHandler(menuhandler) {
		// unregister from old menu-handler
		if (this._menuhandler) {
			this._menuhandler.registerEditor(undefined);
		}
		if (menuhandler) {
			this._menuhandler = menuhandler;
			this._menuhandler.registerEditor(this);
		}
	}


	/**
	 * Resizes inner canvas and GraphViewer to specified width and height.
	 *
	 * @method resizeContent
	 * @param {Number} width The new width.
	 * @param {Number} height The new height.
	 */
	resizeContent(width, height) {
		const cs = this._graphViewer.getCoordinateSystem();
		this._graphViewer.layout(
			cs.deviceToLogX(width, true),
			cs.deviceToLogX(height, true)
		);
		this._graphicSystem.resize(width, height);
	}

	/**
	 * Returns the currently displayed GraphView.
	 *
	 * @method getGraphView
	 * @return {GraphView} The displayed GraphView.
	 */
	getGraphView() {
		return this._graphViewer.getGraphView();
	}

	/**
	 * Returns the currently displayed Graph model.
	 *
	 * @method getGraph
	 * @return {Graph} The displayed Graph model.
	 */
	getGraph() {
		return this._graphViewer ? this._graphViewer.getGraph() : undefined;
	}

	/**
	 * Sets the Graph model to display. This will replace a previously set Graph model.
	 *
	 * @method setGraph
	 * @param {Graph} model The new Graph model to display.
	 */
	setGraph(model) {
		this._deregisterGraphListener();
		// deregister from old graph..
		this._graphViewer.setGraph(model);
		this._registerGraphListener();
		this._graphicSystem.setCoordinateSystem(
			this._graphViewer.getCoordinateSystem()
		);
	}

	/**
	 * Unregisters internal settings listener from currently displayed graph model.
	 *
	 * @method _deregisterGraphListener
	 * @private
	 */
	_deregisterGraphListener() {
		const graph = this.getGraph();
		if (graph) {
			graph.removeEventListener(
				Event.BBOX,
				this._graphListener
			);
			graph.removeEventListener(
				Event.GRAPHSETTINGS,
				this._graphListener
			);
		}
	}

	/**
	 * Registers internal settings listener to currently displayed graph model.
	 *
	 * @method _registerGraphListener
	 * @private
	 */
	_registerGraphListener() {
		const graph = this.getGraph();
		if (graph) {
			graph.addEventListener(
				Event.BBOX,
				this._graphListener
			);
			graph.addEventListener(
				Event.GRAPHSETTINGS,
				this._graphListener
			);
		}
	}

	/**
	 * Returns the internally used GraphViewer which is an instance of ScrollableViewer.
	 *
	 * @method getGraphViewer
	 * @return {ScrollableViewer} The GraphViewer used to display a Graph.
	 */
	getGraphViewer() {
		return this._graphViewer;
	}

	/**
	 * Returns the currently used coordinate system.
	 *
	 * @method getCoordinateSystem
	 * @return {CoordinateSystem} The current coordinate system.
	 */
	getCoordinateSystem() {
		return this._graphViewer.getCoordinateSystem();
	}

	/**
	 * Sets a new coordinate system.
	 *
	 * @method setCoordinateSystem
	 * @param {CoordinateSystem} cs The new coordinate system to use.
	 */
	setCoordinateSystem(cs) {
		this._graphicSystem.setCoordinateSystem(cs);
		this.invalidate();
	}

	/**
	 * Convenience method to set current scroll position of internal {{#crossLink
	 * "ScrollableViewer"}}{{/crossLink}}.
	 *
	 * @method setScrollPosition
	 * @param {Number} hScroll The new horizontal scroll position.
	 * @param {Number} vScroll The new vertical scroll position.
	 */
	setScrollPosition(hScroll, vScroll) {
		const viewer = this.getGraphViewer();
		viewer.getScrollPanel().setScrollPosition(hScroll, vScroll);
		this._graphicSystem.paint();
	}

	/**
	 * Convenience method to hide or show the scale of internal {{#crossLink
	 * "ScrollableViewer"}}{{/crossLink}}.
	 *
	 * @method showScale
	 * @param {Boolean} doIt Specify <code>true</code> to show the scale or <code>false</code> to hide it.
	 */
	showScale(doIt) {
		this.getGraphViewer()
			.getScrollPanel()
			.showScale(doIt);
	}

	/**
	 * Sets the mode to use for displaying a graph view.</br>
	 * Refer to {{#crossLink "GraphSettings.DisplayMode"}}{{/crossLink}} for supported modes.
	 *
	 * @method setViewMode
	 * @param {Number} newmode The new display mode to use.
	 * @deprecated Use {{#crossLink "GraphEditor/setDisplayMode:method"}}{{/crossLink}} instead!
	 */
	setViewMode(newmode) {
		this.setDisplayMode(newmode);
	}

	/**
	 * Sets the mode to use for displaying a graph view.</br>
	 * Refer to {{#crossLink "GraphSettings.DisplayMode"}}{{/crossLink}} for supported modes.
	 *
	 * @method setDisplayMode
	 * @param {Number} newmode The new display mode to use.
	 */
	setDisplayMode(newmode) {
		const settings = this.getGraphSettings();
		if (settings && settings.getDisplayMode() !== newmode) {
			settings.setDisplayMode(newmode);
			this.layout();
			NotificationCenter.getInstance().send(
				new Notification(
					NotificationCenter.DISPLAY_MODE_NOTIFICATION,
					this
				)
			);
		}
	}

	/**
	 * Return the mode to use for displaying a graph view.</br>
	 * Refer to {{#crossLink "GraphSettings.DisplayMode"}}{{/crossLink}} for supported modes.
	 *
	 * @method getDisplayMode
	 * @return {Number} The current display mode.
	 * @since 2.0.0
	 */
	getDisplayMode() {
		const settings = this.getGraphSettings();
		if (settings) {
			return settings.getDisplayMode();
		}

		return undefined;
	}

	/**
	 * Triggers a layout of the content panel of internal {{#crossLink "ScrollableViewer"}}{{/crossLink}}.
	 * Note that calling this method triggers a repaint.
	 *
	 * @method layout
	 */
	layout() {
		this.getGraphViewer()
			.getScrollPanel()
			.getViewPanel()
			.layout();
		this._graphicSystem.paint();
	}

	/**
	 * Invalidates this GraphEditor.</br>
	 * By invalidating the editor its currently displayed {{#crossLink "Graph"}}{{/crossLink}} model is
	 * marked as dirty and its internal {{#crossLink "ScrollableViewer"}}{{/crossLink}} is asked to
	 * layout itself. Note that calling this method triggers a repaint.
	 *
	 * @method invalidate
	 */
	invalidate() {
		// some views within graph might need at least a refresh event (e.g. ItemBar) -> markDirty is not enough, need
		// to  force refresh... this.getGraph().refresh(true);
		this.getGraph().markDirty();
		this._updateLayout();
		this._graphicSystem.paint();
	}

	/**
	 * Performs a layout of inner {{#crossLink "ScrollableViewer"}}{{/crossLink}}.</br>
	 * This method is called on invalidate.
	 *
	 * @method _updateLayout
	 * @private
	 */
	_updateLayout() {
		const cs = this._graphViewer.getCoordinateSystem();
		this.getGraphViewer().layout(
			cs.deviceToLogX(this._graphicSystem.getCanvas().width, true),
			cs.deviceToLogY(this._graphicSystem.getCanvas().height, true)
		);
	}

	/**
	 * Convenience method to perform a paint request to inner {{#crossLink
	 * "GraphicSystem"}}{{/crossLink}}.
	 *
	 * @param {Boolean} [force] Optional flag to force painting, even if drawing is disabled.
	 * @method repaint
	 */
	repaint(force) {
		this._graphicSystem.paint(force);
	}

	/**
	 * Returns the currently displayed area of inner {{#crossLink "ScrollableViewer"}}{{/crossLink}}.</br>
	 *
	 * @method getVisibleGraphRect
	 * @param {Rectangle} [reuserect] Optional rectangle to reuse. If not given a new one will be created.
	 * @return {Rectangle} The currently displayed graph area.
	 * @deprecated Simply use {{#crossLink "GraphEditor/getVisibleViewRect:method"}}{{/crossLink}} instead.
	 */
	getVisibleGraphRect(reuserect) {
		const scrollpanel = this.getGraphViewer().getScrollPanel();
		return scrollpanel.getVisibleGraphRect
			? scrollpanel.getVisibleGraphRect(reuserect)
			: scrollpanel.getViewPort().getVisibleViewRect(reuserect);
	}

	/**
	 * Returns the bounds of currently visible view region.
	 *
	 * @method getVisibleViewRect
	 * @param {Rectangle} [reuserect] Optional rectangle to reuse. If not given a new one will be created.
	 * @return {Rectangle} The bounds of currently visible view region.
	 * @since 1.6.43
	 */
	getVisibleViewRect(reuserect) {
		return this.getGraphView().getVisibleViewRect(reuserect);
	}

	/**
	 * Convenience method to access to settings of currently displayed {{#crossLink
	 * "Graph"}}{{/crossLink}} model.
	 *
	 * @method getGraphSettings
	 * @return {GraphSettings} The settings of currently displayed graph.
	 */
	getGraphSettings() {
		const graph = this.getGraphViewer().getGraph();
		return graph ? graph.getSettings() : undefined;
	}

	/**
	 * Returns the SelectionProvider instance used to handle {{#crossLink "GraphItem"}}{{/crossLink}}
	 * selection.
	 *
	 * @method getSelectionProvider
	 * @return {SelectionProvider} The SelectionProvider used to handle GraphItem selection.
	 */
	getSelectionProvider() {
		return this.getGraphViewer().getSelectionProvider();
	}

	/**
	 * Convenience method to set the new zoom factor of inner GraphViewer.</br>
	 * Note: this method accepts the predefined zoom factors like <code>ZOOM_FIT</code>, <code>ZOOM_FITHORZ</code> or
	 * <code>ZOOM_FITVERT</code> to perform special zoom behavior.
	 *
	 * @method setZoom
	 * @param {Number} factor The new zoom to use.
	 */
	setZoom(factor) {
		this.getGraphViewer().setZoom(factor);
		this.invalidate();
	}

	/**
	 * Convenience method to return the current zoom factor of inner GraphViewer.
	 *
	 * @method getZoom
	 * @return {Number} The current zoom factor.
	 */
	getZoom() {
		return this.getGraphViewer().getZoom();
	}

	/**
	 * This method should be called when this GraphEditor is no longer needed to release used resources.
	 *
	 * @method destroy
	 */
	destroy() {
		this._deregisterGraphListener();
		this.setItemMenuHandler(undefined);
		this._graphListener._editor = undefined;
		this._interactionHandler.dispose();

		// unregister from global ImagePool and LayoutFactory.
		JSG.imagePool.unregisterEditor(this);
		JSG.layoutFactory.unregisterEditor(this);

		// remove from canvas:
		this._graphicSystem.canvas._jsgEditor = undefined;
		this._graphicSystem.destroy();
		this._graphViewer.destroy();

		this._viewmodes = undefined;
		this._graphViewer = undefined;
		this._graphicSystem = undefined;
		this._graphListener = undefined;
		this._interactionHandler = undefined;
	}

	// Zoom commands
	/**
	 * A predefined zoom factor to perform a zoom to fit.</br>
	 * This factor can be passed to {{#crossLink "GraphEditor/setZoom:method"}}{{/crossLink}}.
	 *
	 * @property ZOOM_FIT
	 * @type {Number}
	 * @static
	 */
	static get ZOOM_FIT() {
		return -1;
	}
	/**
	 * A predefined zoom factor to perform a horizontal zoom to fit.</br>
	 * This factor can be passed to {{#crossLink "GraphEditor/setZoom:method"}}{{/crossLink}}.
	 *
	 * @property ZOOM_FITHORZ
	 * @type {Number}
	 * @static
	 */
	static get ZOOM_FITHORZ() {
		return -2;
	}
	/**
	 * A predefined zoom factor to perform a vertical zoom to fit.</br>
	 * This factor can be passed to {{#crossLink "GraphEditor/setZoom:method"}}{{/crossLink}}.
	 *
	 * @property ZOOM_FITVERT
	 * @type {Number}
	 * @static
	 */
	static get ZOOM_FITVERT() {
		return -3;
	}
}

export default GraphEditor;
