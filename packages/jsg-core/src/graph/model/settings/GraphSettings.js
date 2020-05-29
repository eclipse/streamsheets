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
const JSG = require('../../../JSG');
const ObjectFactory = require('../../../ObjectFactory');
const AbstractSettings = require('./AbstractSettings');
const Dictionary = require('../../../commons/Dictionary');
const ItemAttributes = require('../../attr/ItemAttributes');
const Notification = require('../../notifications/Notification');
const NotificationCenter = require('../../notifications/NotificationCenter');
const Event = require('../events/Event');
const GraphSettingsEvent = require('./GraphSettingsEvent');

/**
 * The GraphSettings class contains globally and mainly graph related settings.</br>
 * Besides the predefined settings it is also possible to store custom settings by using the
 * {{#crossLink "GraphSettings/addSetting:method"}}{{/crossLink}} method.
 * Note that in order to save and load custom settings the provided value must implement a
 * <code>read</code> and a <code>save</code> method. To store a custom setting <code>save</code>
 * is called on its value with an <code>Writer</code> instance as parameter. Analog to load a
 * custom setting <code>read</code> is called with an XML node to restore the value from.</br>
 * See {{#crossLink "CustomSetting"}}{{/crossLink}} to get information
 * about what a custom setting must provide.<br/>
 *
 * @class GraphSettings
 * @extends AbstractSettings
 * @param {Graph} graph The <code>Graph</code> model for which these settings are.
 * @constructor
 */
class GraphSettings extends AbstractSettings {
	constructor(graph) {
		super(graph);
		this._settings = new Dictionary();
		this.reset();
		this._gfxfilter = undefined;
	}

	/**
	 * Resets all settings to predefined default values.
	 *
	 * @method reset
	 * @since 1.6.43
	 * @for GraphSettings
	 */
	reset() {
		this._settings.put(GraphSettings.SettingID.VIEW_MODE, GraphSettings.ViewMode.DEFAULT);
		this._settings.put(GraphSettings.SettingID.DISPLAY_MODE, GraphSettings.DisplayMode.ENDLESS);
		this._settings.put(GraphSettings.SettingID.GRIDVISIBLE, true);
		this._settings.put(GraphSettings.SettingID.ORIGINVISIBLE, false);
		this._settings.put(GraphSettings.SettingID.GRIDSTYLE, GraphSettings.GridStyle.GRID);
		this._settings.put(GraphSettings.SettingID.PORTSVISIBLE, false);
		this._settings.put(GraphSettings.SettingID.PORTHIGHLIGHTSVISIBLE, true);
		this._settings.put(GraphSettings.SettingID.PORTHIGHLIGHTDELAY, 600);
		this._settings.put(GraphSettings.SettingID.NAMESVISIBLE, false);
		this._settings.put(GraphSettings.SettingID.AVAILABLEPORTSVISIBLE, false);
		this._settings.put(GraphSettings.SettingID.SCALEVISIBLE, true);
		this._settings.put(GraphSettings.SettingID.SCALEENDLESS, false);
		this._settings.put(GraphSettings.SettingID.SELECTTOPONLY, true);
		this._settings.put(GraphSettings.SettingID.SNAPTOGRID, true);
		this._settings.put(GraphSettings.SettingID.SNAPTOSHAPES, true);
		this._settings.put(GraphSettings.SettingID.SNAPROTATION, true);
		this._settings.put(GraphSettings.SettingID.SNAPTOPORT, ItemAttributes.PortMode.ALL);
		this._settings.put(GraphSettings.SettingID.SNAPGRIDUNIT, 250);
		this._settings.put(GraphSettings.SettingID.AUTOSCROLL, true);
		this._settings.put(GraphSettings.SettingID.PANNINGENABLED, true);
	}

	/**
	 * Creates a copy of this GraphSettings instance.
	 *
	 * @method copy
	 * @param {Graph} [graph] The graph to which copied settings should belong to.
	 * @return {GraphSettings} A copy of this graph settings.
	 */
	copy(graph) {
		const copy = new GraphSettings(graph || this._item);
		copy.setTo(this);
		return copy;
	}

	/**
	 * Sets the values of this GraphSettings instance to given one.
	 *
	 * @method setTo
	 * @param {GraphSettings} settings The new settings.
	 * @return {Boolean} <code>true</code> if values were set, <code>false</code> otherwise.
	 */
	setTo(settings) {
		const event = this._item ? this._createEvent(Event.ALL) : undefined;
		this.sendPreEventToItem(this._item, event);
		const doIt = event ? event.doIt : true;
		if (doIt) {
			this._settings.put(GraphSettings.SettingID.AUTOSCROLL, settings.getAutoScroll());
			this._settings.put(GraphSettings.SettingID.AVAILABLEPORTSVISIBLE, settings.getAvailablePortsVisible());
			this._settings.put(GraphSettings.SettingID.DISPLAY_MODE, settings.getDisplayMode());
			this._settings.put(GraphSettings.SettingID.GRIDSTYLE, settings.getGridStyle());
			this._settings.put(GraphSettings.SettingID.GRIDVISIBLE, settings.getGridVisible());
			this._settings.put(GraphSettings.SettingID.ORIGINVISIBLE, settings.getOriginVisible());
			this._settings.put(GraphSettings.SettingID.NAMESVISIBLE, settings.getNamesVisible());
			this._settings.put(GraphSettings.SettingID.PORTSVISIBLE, settings.getPortsVisible());
			this._settings.put(GraphSettings.SettingID.PORTHIGHLIGHTSVISIBLE, settings.getPortHighlightsVisible());
			this._settings.put(GraphSettings.SettingID.PORTHIGHLIGHTDELAY, settings.getPortHighlightDelay());
			this._settings.put(GraphSettings.SettingID.SCALEVISIBLE, settings.getScaleVisible());
			this._settings.put(GraphSettings.SettingID.SCALEENDLESS, settings.getScaleEndless());
			this._settings.put(GraphSettings.SettingID.SELECTTOPONLY, settings.getSelectTopOnly());
			this._settings.put(GraphSettings.SettingID.SNAPGRIDUNIT, settings.getSnapStep());
			this._settings.put(GraphSettings.SettingID.SNAPTOGRID, settings.getSnapToGrid());
			this._settings.put(GraphSettings.SettingID.SNAPTOPORT, settings.getSnapToPort());
			this._settings.put(GraphSettings.SettingID.SNAPTOSHAPES, settings.getSnapToShapes());
			this._settings.put(GraphSettings.SettingID.SNAPROTATION, settings.getSnapRotation());
			this._settings.put(GraphSettings.SettingID.VIEW_MODE, settings.getViewMode());
			this._settings.put(GraphSettings.SettingID.PANNINGENABLED, settings.getPanningEnabled());
			this.sendPostEventToItem(this._item, event);
		}
		return doIt;
	}

	/**
	 * Called by {{#crossLink "Graph"}}{{/crossLink}} on its model refresh cycle.<br/>
	 * @method refresh
	 * @since 2.0.4
	 */
	refresh() {}

	/**
	 * Returns the current display mode.
	 *
	 * @method getDisplayMode
	 * @return {GraphSettings.DisplayMode} Current display mode.
	 */
	getDisplayMode() {
		return this.getSetting(GraphSettings.SettingID.DISPLAY_MODE);
	}

	/**
	 * Set the current display mode.
	 *
	 * @method setDisplayMode
	 * @param {GraphSettings.DisplayMode} mode New display mode.
	 * @return {Boolean} <code>true</code> if new mode was set, <code>false</code> otherwise.
	 */
	setDisplayMode(mode) {
		const state = this._changeSetting(GraphSettings.SettingID.DISPLAY_MODE, mode);
		NotificationCenter.getInstance().send(
			new Notification(NotificationCenter.DISPLAY_MODE_NOTIFICATION, this)
		);
		return state;
	}

	/**
	 * Returns the current view mode.<br/>
	 * This is either one of the predefined view mode constants as in {{#crossLink
	 * "GraphSettings.ViewMode"}}{{/crossLink}} or a custom string.
	 *
	 * @method getViewMode
	 * @return {String} Current view mode setting.
	 */
	getViewMode() {
		return this.getSetting(GraphSettings.SettingID.VIEW_MODE);
	}

	/**
	 * Set the current view mode.<br/>
	 * This either can be one of the predefined view mode constants as in {{#crossLink
	 * "GraphSettings.ViewMode"}}{{/crossLink}} or a custom string to support custom view modes.
	 *
	 * @method setViewMode
	 * @param {String} mode New view mode.
	 * @return {Boolean} <code>true</code> if new mode was set, <code>false</code> otherwise.
	 */
	setViewMode(mode) {
		return this._changeSetting(GraphSettings.SettingID.VIEW_MODE, mode);
	}

	/**
	 * Returns the grid style.
	 *
	 * @method getGridStyle
	 * @return {GraphSettings.GridStyle} Returns current grid style.
	 */
	getGridStyle() {
		return this.getSetting(GraphSettings.SettingID.GRIDSTYLE);
	}

	/**
	 * Sets the grid style.
	 *
	 * @method setGridStyle
	 * @param {GraphSettings.GridStyle} New grid style.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setGridStyle(style) {
		return this._changeSetting(GraphSettings.SettingID.GRIDSTYLE, style);
	}

	/**
	 * Returns if the grid is visible or not.
	 *
	 * @method getGridVisible
	 * @return {Boolean} <code>true</code> if grid is visible, <code>false</code> otherwise
	 */
	getGridVisible() {
		return this.getSetting(GraphSettings.SettingID.GRIDVISIBLE);
	}

	/**
	 * Sets the grid visible flag.
	 *
	 * @method setGridVisible
	 * @param {Boolean} doIt Specify <code>true</code> to draw a grid, <code>false<code> to hide it.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setGridVisible(doIt) {
		return this._changeSetting(GraphSettings.SettingID.GRIDVISIBLE, doIt);
	}

	/**
	 * Returns if the origin marker is visible or not.
	 *
	 * @method getOriginVisible
	 * @return {Boolean} <code>true</code> if origin marker is visible, <code>false</code> otherwise
	 * @since 2.1.0.4
	 */
	getOriginVisible() {
		return this.getSetting(GraphSettings.SettingID.ORIGINVISIBLE);
	}

	/**
	 * Sets the origin visible flag.
	 *
	 * @method setOriginVisible
	 * @param {Boolean} doIt Specify <code>true</code> to draw an origin marker, <code>false<code> to hide it.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 * @since 2.1.0.4
	 */
	setOriginVisible(doIt) {
		return this._changeSetting(GraphSettings.SettingID.ORIGINVISIBLE, doIt);
	}

	/**
	 * Returns if the port marker should be displayed for existing ports or not.
	 *
	 * @method getPortsVisible
	 * @return {Boolean} <code>true</code> if port markers should be displayed, <code>false</code> otherwise.
	 */
	getPortsVisible() {
		return this.getSetting(GraphSettings.SettingID.PORTSVISIBLE);
	}

	/**
	 * Sets the ports visible flag. If set to <code>true</code> markers are shown for existing ports.
	 *
	 * @method setPortsVisible
	 * @param {Boolean} doIt Specify <code>true</code> to display port markers, <code>false<code> to hide them.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setPortsVisible(doIt) {
		return this._changeSetting(GraphSettings.SettingID.PORTSVISIBLE, doIt);
	}

	/**
	 * Returns if the available ports should be displayed if you hover over a node.
	 *
	 * @method getPortHighlightsVisible
	 * @return {Boolean} <code>true</code> if port markers should be displayed, <code>false</code> otherwise.
	 * @since 2.0
	 */
	getPortHighlightsVisible() {
		return this.getSetting(GraphSettings.SettingID.PORTHIGHLIGHTSVISIBLE);
	}

	/**
	 * Sets the port highlights visible flag. If set to <code>true</code> markers are shown for available ports, if you
	 * hover over them.
	 *
	 * @method setPortHighlightsVisible
	 * @param {Boolean} doIt Specify <code>true</code> to display port markers, <code>false<code> to hide them.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 * @since 2.0
	 */
	setPortHighlightsVisible(doIt) {
		return this._changeSetting(GraphSettings.SettingID.PORTHIGHLIGHTSVISIBLE, doIt);
	}

	/**
	 * Returns if an available port should be displayed if you hover over a node after a delay.
	 *
	 * @method getPortHighlightDelay
	 * @return {Boolean} <code>true</code> if the active port marker should be displayed after a delay,
	 *     <code>false</code> otherwise.
	 * @since 2.0.23.0
	 */
	getPortHighlightDelay() {
		return this.getSetting(GraphSettings.SettingID.PORTHIGHLIGHTDELAY);
	}

	/**
	 * Sets the port highlight delay. If set to <code>true</code> a port marker is shown after the given period, if you
	 * hover over it.
	 *
	 * @method setPortHighlightDelay
	 * @param {Boolean} doIt Specify <code>true</code> to display the active port marker after a delay,
	 *     <code>false<code> to disable this feature.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 * @since 2.0.23.0
	 */
	setPortHighlightDelay(doIt) {
		return this._changeSetting(GraphSettings.SettingID.PORTHIGHLIGHTDELAY, doIt);
	}

	/**
	 * Returns if the marker for available ports should be displayed or not.
	 *
	 * @method getAvailablePortsVisible
	 * @return {Boolean} <code>true</code> if port markers should be displayed, <code>false</code> otherwise.
	 */
	getAvailablePortsVisible() {
		return this.getSetting(GraphSettings.SettingID.AVAILABLEPORTSVISIBLE);
	}

	/**
	 * Sets the available ports visible flag. If set to <code>true</code> markers are shown.
	 *
	 * @method setAvailablePortsVisible
	 * @param {Boolean} doIt Specify <code>true</code> to display port markers, <code>false</code> to hide them.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setAvailablePortsVisible(doIt) {
		return this._changeSetting(GraphSettings.SettingID.AVAILABLEPORTSVISIBLE, doIt);
	}

	/**
	 * Returns if the name of the graph items should be displayed or not. If true, the name are displayed
	 * below the graphitem.
	 *
	 * @method getNamesVisible
	 * @return {Boolean} <code>true</code> if port markers should be displayed, <code>false</code> otherwise.
	 */
	getNamesVisible() {
		return this.getSetting(GraphSettings.SettingID.NAMESVISIBLE);
	}

	/**
	 * Sets the names visible flag. If set to <code>true</code> graphitem names are shown.
	 *
	 * @method setNamesVisible
	 * @param {Boolean} doIt Specify <code>true</code> to display name, <code>false<code> to hide them.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setNamesVisible(doIt) {
		return this._changeSetting(GraphSettings.SettingID.NAMESVISIBLE, doIt);
	}

	/**
	 * Returns if scale is visible or not.
	 *
	 * @method getScaleVisible
	 * @return {Boolean} <code>true</code> if the scale should be displayed, <code>false</code> otherwise.
	 */
	getScaleVisible() {
		return this.getSetting(GraphSettings.SettingID.SCALEVISIBLE);
	}

	/**
	 * Sets the scale visible flag.
	 *
	 * @method setScaleVisible
	 * @param {Boolean} doIt Specify <code>true</code> to display scales around the graph, <code>false<code> to hide
	 *     them.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setScaleVisible(doIt) {
		return this._changeSetting(GraphSettings.SettingID.SCALEVISIBLE, doIt);
	}

	/* Returns if scale is drawn across complete canvas or current graph size.
	 *
	 * @method getScaleEndless
	 * @return {Boolean} <code>true</code> if the scale should be displayed, <code>false</code> otherwise.
	 * @since 2.2.14
	 */
	getScaleEndless() {
		return this.getSetting(GraphSettings.SettingID.SCALEENDLESS);
	}

	/**
	 * Sets the scale visible flag.
	 *
	 * @method setScaleEndless
	 * @param {Boolean} doIt Specify <code>true</code> to draw scales in endless mode across the canvas,
	 * <code>false<code> to draw scales only acress the graph.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 * @since 2.2.14
	 */
	setScaleEndless(doIt) {
		const ret = this._changeSetting(GraphSettings.SettingID.SCALEENDLESS, doIt);
		NotificationCenter.getInstance().send(
			new Notification(NotificationCenter.DISPLAY_MODE_NOTIFICATION, this)
		);
		return ret;
	}

	/**
	 * Returns, if only the top item should be selected.
	 *
	 * @method getSelectTopOnly
	 * @return {Boolean} <code>true</code> if the mode is activated, <code>false</code> otherwise.
	 * @since 2.1.0.2
	 */
	getSelectTopOnly() {
		return this.getSetting(GraphSettings.SettingID.SELECTTOPONLY);
	}

	/**
	 * Sets selection mode to a behavior, where it selects only the top most item and not items
	 * that are visbily below the item.
	 *
	 * @method setSelectTopOnly
	 * @param {Boolean} doIt Specify <code>true</code> to active this selection behavior, <code>false<code> to
	 *     deactivate.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 * @since 2.1.0.2
	 */
	setSelectTopOnly(doIt) {
		return this._changeSetting(GraphSettings.SettingID.SELECTTOPONLY, doIt);
	}

	/**
	 * Returns if snap to grid should be applied or not.
	 *
	 * @method getSnapToGrid
	 * @return {Boolean} <code>true</code> if items should snap to grid on move, <code>false</code> otherwise.
	 */
	getSnapToGrid() {
		return this.getSetting(GraphSettings.SettingID.SNAPTOGRID);
	}

	/**
	 * Sets the snap to grid flag. If <code>true</code> is specified items will snap to grid on move,
	 * rotation and creation.
	 *
	 * @method setSnapToGrid
	 * @param {Boolean} doIt Specify <code>true</code> to snap items to grid on move, rotation and creation, specify
	 *     <code>false<code> otherwise.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setSnapToGrid(doIt) {
		return this._changeSetting(GraphSettings.SettingID.SNAPTOGRID, doIt);
	}

	/**
	 * Returns the currently used snap step. The value specifies how much an item will travel in x and
	 * y direction on (e.g.) move.
	 *
	 * @method getSnapStep
	 * @return {Number} The snap step to use.
	 */
	getSnapStep() {
		return this.getSetting(GraphSettings.SettingID.SNAPGRIDUNIT);
	}

	/**
	 * Sets the snap step to use as a fix delta value for an item. The default value is 25mm.
	 *
	 * @method setSnapStep
	 * @param {Number} step The snap step value to use.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setSnapStep(step) {
		return this._changeSetting(GraphSettings.SettingID.SNAPGRIDUNIT, step);
	}

	/**
	 * Returns if {{#crossLink "Edge"}}{{/crossLink}}s should snap to a port if either
	 * its source or target end is near a valid port.
	 *
	 * @method getSnapToPort
	 * @return {Boolean} <code>true</code> if edges should snap to near ports, <code>false</code> otherwise
	 */
	getSnapToPort() {
		return this.getSetting(GraphSettings.SettingID.SNAPTOPORT);
	}

	/**
	 * Sets the snap to port flag. If <code>true</code> is specified the source and target end of edges
	 * will snap to near ports on creation and resize.
	 *
	 * @method setSnapToPort
	 * @param {Boolean} doIt Specify <code>true</code> to let edges snap to near ports, <code>false<code> otherwise.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setSnapToPort(doIt) {
		return this._changeSetting(GraphSettings.SettingID.SNAPTOPORT, doIt);
	}

	/**
	 * Returns <code>true</code> if an item should be aligned to a near placed shape on move.
	 *
	 * @method getSnapToShapes
	 * @return {Boolean} <code>true</code> if an item should be aligned to a near placed shape, <code>false</code>
	 *     otherwise.
	 */
	getSnapToShapes() {
		return this.getSetting(GraphSettings.SettingID.SNAPTOSHAPES);
	}

	/**
	 * Sets the snap to shapes flag. If <code>true</code> is specified an item should be aligned to a near placed shape
	 * on move.
	 *
	 * @method setSnapToShapes
	 * @param {Boolean} doIt Specify <code>true</code> to align item to a near placed shape, <code>false</code>
	 *     otherwise.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setSnapToShapes(doIt) {
		return this._changeSetting(GraphSettings.SettingID.SNAPTOSHAPES, doIt);
	}

	/**
	 * Returns <code>true</code> if an item should rotate in 5 degree steps.
	 *
	 * @method getSnapRotation
	 * @return {Boolean} <code>true</code> if an item should rotate in steps, <code>false</code> otherwise.
	 */
	getSnapRotation() {
		return this.getSetting(GraphSettings.SettingID.SNAPROTATION);
	}

	/**
	 * Sets the snap to rotation flag. If <code>true</code> is specified an item should rotate in steps.
	 *
	 * @method setSnapRotation
	 * @param {Boolean} doIt Specify <code>true</code> to rotate an item in 5 degrees steps, <code>false</code>
	 *     otherwise.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setSnapRotation(doIt) {
		return this._changeSetting(GraphSettings.SettingID.SNAPROTATION, doIt);
	}

	/**
	 * Returns <code>true</code> if the Graph should  scroll, if the mouse is dragged outside the visible area.
	 *
	 * @method getAutoScroll
	 * @return {Boolean} <code>true</code> if auto scrolling is enabled, <code>false</code> otherwise.
	 */
	getAutoScroll() {
		return this.getSetting(GraphSettings.SettingID.AUTOSCROLL);
	}

	/**
	 * Sets the AutoScroll flag. If <code>true</code> is specified the graph scrolls, if the mouse is dragged outside
	 * the visible area of the graph.
	 *
	 * @method setAutoScroll
	 * @param {Boolean} doIt Specify <code>true</code> to enable auto scrolling, <code>false</code> otherwise.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 */
	setAutoScroll(doIt) {
		return this._changeSetting(GraphSettings.SettingID.AUTOSCROLL, doIt);
	}

	/**
	 * Returns <code>true</code> if the Graph should  scroll, if the mouse is dragged while pushing the right mouse
	 * button.
	 *
	 * @method getPanningEnabled
	 * @return {Boolean} <code>true</code> if panning is enabled, <code>false</code> otherwise.
	 * @since 2.0.22.5
	 */
	getPanningEnabled() {
		return this.getSetting(GraphSettings.SettingID.PANNINGENABLED);
	}

	/**
	 * Sets the Panning enabled flag. If <code>true</code> is specified the graph scrolls, if the mouse is dragged
	 * while pushing the right mouse button.
	 *
	 * @method setPanningEnabled
	 * @param {Boolean} doIt Specify <code>true</code> to enable panning, <code>false</code> otherwise.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 * @since 2.0.22.5
	 */
	setPanningEnabled(doIt) {
		return this._changeSetting(GraphSettings.SettingID.PANNINGENABLED, doIt);
	}

	/**
	 * Changes setting for given id. </br>
	 * Note: this method generates and fires a {{#crossLink
	 * "GraphSettingsEvent"}}{{/crossLink}}.
	 *
	 * @method _changeSetting
	 * @param {String} id A unique id to reference the setting value to change.
	 * @param {Object} newValue The new setting value.
	 * @return {Boolean} <code>true</code> if new value was set, <code>false</code> otherwise.
	 * @private
	 */
	_changeSetting(id, newValue) {
		if (id) {
			const setting = this._settings.get(id);
			if (setting !== newValue) {
				const event = this._item ? this._createEvent(id, newValue) : undefined;
				this.sendPreEventToItem(this._item, event);
				const doIt = event ? event.doIt : true;
				if (doIt) {
					this._settings.put(id, newValue);
					this.sendPostEventToItem(this._item, event);
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Creates a new GraphSettingsEvent with specified detailId and value.
	 *
	 * @method _createEvent
	 * @param {String} id The event detailId.
	 * @param {Object} id The event value.
	 * @return {GraphSettingsEvent} The created event instance.
	 * @private
	 */
	_createEvent(id, newValue) {
		return new GraphSettingsEvent(id, newValue);
	}

	/**
	 * Adds a new setting object to the settings list. </br>
	 * Note: this will overwrite any existing setting for the provided settingId.
	 *
	 * @method addSetting
	 * @param {String} settingId A unique id to reference provided value.
	 * @param {Object} value The setting object to add.
	 */
	addSetting(settingId, setting) {
		setting.setGraphSettings(this);
		const prevsetting = this._settings.put(settingId, setting);
		if (prevsetting) {
			prevsetting.setGraphSettings(undefined);
		}
	}

	/**
	 * Returns the setting object for given id or <code>undefined</code> if none was added before.
	 *
	 * @method getSetting
	 * @param {String} settingId A unique id to reference setting value.
	 * @return {Object} The matching setting object or <code>undefined</code>
	 */
	getSetting(settingId) {
		return this._settings.get(settingId);
	}

	/**
	 * Removes the setting object for given id.
	 *
	 * @method removeSetting
	 * @param {String} settingId A unique id to reference provided value.
	 * @return {Object} The removed setting object or <code>undefined</code>.
	 */
	removeSetting(settingId) {
		const setting = this._settings.remove(settingId);
		if (setting) {
			setting.setGraphSettings(undefined);
		}
		return setting;
	}

	/**
	 * Enables or disables a filter used to influence graph drawing.<br/>
	 * Please refer to {{#crossLink "Graphics"}}{{/crossLink}} for more information regarding the filter
	 * feature.
	 * @method useFilter
	 * @param {Boolean} doIt Specify <code>true</code> to enable filter, <code>false</code> otherwise.
	 * @param {Object} [filter] An optional filter object. If specified this filter is used otherwise the currently set
	 * {{#crossLink "GraphSettings/DEF_FILTER:property"}}{{/crossLink}} is applied.
	 * @since 2.0.22.0
	 */
	useFilter(doIt, filter) {
		this._gfxfilter = doIt ? filter || GraphSettings.DEF_FILTER : undefined;
	}

	/**
	 * Returns the filter object to apply or <code>undefined</code> if no filter should be used.<br/>
	 * Please refer to {{#crossLink "Graphics"}}{{/crossLink}} for more information regarding the filter
	 * feature.
	 * @method getFilter
	 * @return {Object|undefined} The filter to use or <code>undefined</code>.
	 * @since 2.0.22.0
	 */
	getFilter() {
		return this._gfxfilter;
	}

	/**
	 * Reads the GraphSettings.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		let i;
		let customSettings;

		function setBoolean(id, value, settings) {
			if (value) {
				const newValue = value === 'true';
				settings.put(id, newValue);
			}
		}

		function setNumber(id, value, settings) {
			if (value) {
				const newValue = Number(value);
				settings.put(id, newValue);
			}
		}

		function setString(id, value, settings) {
			if (value) {
				settings.put(id, value);
			}
		}

		function readCustomSetting(setting, self) {
			const id = reader.getAttribute(setting, 'id');
			const clazz = reader.getAttribute(setting, 'class');
			if (id && clazz) {
				const value = ObjectFactory.create(clazz);
				if (value) {
					value.read(setting, customSettings[i]);
					self.addSetting(id, value);
				}
			}
		}

		setString(GraphSettings.SettingID.VIEW_MODE, reader.getAttribute(object, 'viewmode'), this._settings);
		setNumber(GraphSettings.SettingID.DISPLAY_MODE, reader.getAttribute(object, 'dplmode'), this._settings);

		setBoolean(GraphSettings.SettingID.GRIDVISIBLE, reader.getAttribute(object, 'grid'), this._settings);
		setNumber(GraphSettings.SettingID.GRIDSTYLE, reader.getAttribute(object, 'gridstyle'), this._settings);
		setBoolean(GraphSettings.SettingID.ORIGINVISIBLE, reader.getAttribute(object, 'origin'), this._settings);
		setBoolean(GraphSettings.SettingID.PORTSVISIBLE, reader.getAttribute(object, 'ports'), this._settings);

		setBoolean(
			GraphSettings.SettingID.AVAILABLEPORTSVISIBLE,
			reader.getAttribute(object, 'availableports'),
			this._settings
		);
		setBoolean(
			GraphSettings.SettingID.PORTHIGHLIGHTSVISIBLE,
			reader.getAttribute(object, 'porthighlights'),
			this._settings
		);
		setNumber(
			GraphSettings.SettingID.PORTHIGHLIGHTDELAY,
			reader.getAttribute(object, 'porthighlightdelay'),
			this._settings
		);

		setBoolean(GraphSettings.SettingID.NAMESVISIBLE, reader.getAttribute(object, 'names'), this._settings);

		setBoolean(GraphSettings.SettingID.SNAPTOGRID, reader.getAttribute(object, 'snaptogrid'), this._settings);
		setBoolean(GraphSettings.SettingID.SNAPTOSHAPES, reader.getAttribute(object, 'snaptoshapes'), this._settings);
		setBoolean(GraphSettings.SettingID.SNAPROTATION, reader.getAttribute(object, 'snaprotation'), this._settings);
		setBoolean(GraphSettings.SettingID.SCALEVISIBLE, reader.getAttribute(object, 'scale'), this._settings);
		setBoolean(GraphSettings.SettingID.SCALEENDLESS, reader.getAttribute(object, 'scaleendless'), this._settings);
		setBoolean(GraphSettings.SettingID.SELECTTOPONLY, reader.getAttribute(object, 'selecttoponly'), this._settings);
		setBoolean(GraphSettings.SettingID.AUTOSCROLL, reader.getAttribute(object, 'autoscroll'), this._settings);
		setBoolean(
			GraphSettings.SettingID.PANNINGENABLED,
			reader.getAttribute(object, 'panningenabled'),
			this._settings
		);

		setNumber(GraphSettings.SettingID.SNAPTOPORT, reader.getAttribute(object, 'snaptoport'), this._settings);
		setNumber(GraphSettings.SettingID.SNAPGRIDUNIT, reader.getAttribute(object, 'snapstep'), this._settings);

		// read in custom settings:
		reader.iterateObjects(object, (name, child) => {
			switch (name) {
				case 'custom':
					readCustomSetting(child, this);
					break;
				default:
					break;
			}
		});
	}

	/**
	 * Saves this GraphSettings to XML.
	 *
	 * @method save
	 * @param {Writer} writer Writer object to save to.
	 */
	save(writer) {
		/* returns an array of custom settings which provide a save method */
		function filterCustomSettings(settings) {
			const IDs = GraphSettings.SettingID;
			const custom = [];

			function isCustomSetting(id, value) {
				if (!Object.prototype.hasOwnProperty.call(IDs, id) && value.save && value.getClassString) {
					custom.push({
						id,
						clazz: value.getClassString(),
						value
					});
				}
			}

			settings.iterate(isCustomSetting);
			return custom;
		}

		function saveCustomSetting(setting) {
			writer.writeStartElement('custom');
			writer.writeAttributeString('id', setting.id);
			writer.writeAttributeString('class', setting.clazz);
			setting.value.save(writer);
			writer.writeEndElement();
		}

		writer.writeStartElement('settings');
		writer.writeAttributeString('viewmode', this.getViewMode());
		writer.writeAttributeString('dplmode', this.getDisplayMode());
		writer.writeAttributeString('grid', this.getGridVisible());
		writer.writeAttributeString('gridstyle', this.getGridStyle());
		writer.writeAttributeString('origin', this.getOriginVisible());
		writer.writeAttributeString('ports', this.getPortsVisible());
		writer.writeAttributeString('porthighlights', this.getPortHighlightsVisible());
		writer.writeAttributeString('porthighlightdelay', this.getPortHighlightDelay());
		writer.writeAttributeString('names', this.getNamesVisible());
		writer.writeAttributeString('availableports', this.getAvailablePortsVisible());
		writer.writeAttributeString('scale', this.getScaleVisible());
		writer.writeAttributeString('scaleendless', this.getScaleEndless());
		writer.writeAttributeString('selecttoponly', this.getSelectTopOnly());
		writer.writeAttributeString('snaptogrid', this.getSnapToGrid());
		writer.writeAttributeString('snaptoshapes', this.getSnapToShapes());
		writer.writeAttributeString('snaprotation', this.getSnapRotation());
		writer.writeAttributeString('snaptoport', this.getSnapToPort());
		writer.writeAttributeString('snapstep', this.getSnapStep());
		writer.writeAttributeString('autoscroll', this.getAutoScroll());
		writer.writeAttributeString('panningenabled', this.getPanningEnabled());

		const customSettings = filterCustomSettings(this._settings);
		customSettings.forEach((setting) => {
			saveCustomSetting(setting);
		});

		writer.writeEndElement();
	}

	/**
	 * Identifiers which specifies predefined settings.</br>
	 * These IDs are also used as the detailedId within the
	 * {{#crossLink "GraphSettingsEvent"}}{{/crossLink}}.
	 *
	 * @class SettingID
	 * @constructor
	 * @static
	 */
	static get SettingID() {
		return {
			AUTOSCROLL: 'setting:autoscroll',
			AVAILABLEPORTSVISIBLE: 'setting:availableportvisible',
			DISPLAY_MODE: 'setting:displaymode',
			GRIDSTYLE: 'setting:gridstyle',
			GRIDVISIBLE: 'setting:gridvisible',
			ORIGINVISIBLE: 'setting:originvisible',
			NAMESVISIBLE: 'setting:namesvisible',
			PORTSVISIBLE: 'setting:portvisible',
			PORTHIGHLIGHTSVISIBLE: 'setting:porthighlightsvisible',
			PORTHIGHLIGHTDELAY: 'setting:porthighlightdelay',
			SCALEVISIBLE: 'setting:scalevisible',
			SCALEENDLESS: 'setting:scaleendless',
			SELECTTOPONLY: 'setting:selecttoponly',
			SNAPGRIDUNIT: 'setting:snapgridunit',
			SNAPTOGRID: 'setting:snaptogrid',
			SNAPTOPORT: 'setting:snaptoport',
			SNAPTOSHAPES: 'setting:snaptoshapes',
			SNAPROTATION: 'setting:snaprotation',
			PANNINGENABLED: 'setting:panningenabled',
			VIEW_MODE: 'setting:viewmode'
		};
	}

	/**
	 * Predefined view mode settings.
	 * @class ViewMode
	 */
	static get ViewMode() {
		return {
			/**
			 * Constant for default view mode.
			 *
			 * @property DEFAULT
			 * @type {String}
			 * @static
			 */
			DEFAULT: 'jsg:vm:default',

			/**
			 * Constant for default ready-only mode.
			 *
			 * @property READ_ONLY
			 * @type {String}
			 * @static
			 */
			READ_ONLY: 'jsg:vm:readonly',

			/**
			 * Constant for default print preview mode.
			 *
			 * @property PRINT_PREVIEW
			 * @type {String}
			 * @static
			 */
			PRINT_PREVIEW: 'jsg:vm:printpreview'
		};
	}

	/**
	 * Predefined grid style settings.
	 * @class GridStyle
	 */
	static get GridStyle() {
		return {
			/**
			 * Constant for grid visualization styles. Here the grid is displayed using vertical and horizontal lines.
			 *
			 * @property GRID
			 * @type {Number}
			 * @static
			 */
			GRID: 0,

			/**
			 * Constant for grid visualization styles. Here the grid is displayed using small crosses.
			 *
			 * @property CROSSES
			 * @type {Number}
			 * @static
			 */
			CROSSES: 1,

			/**
			 * Constant for grid visualization styles. Here the grid is displayed using dots.
			 *
			 * @property DOTS
			 * @type {Number}
			 * @static
			 */
			DOTS: 2
		};
	}
	/**
	 * Drawing area display modes
	 * @class DisplayMode
	 */
	static get DisplayMode() {
		return {
			/**
			 * The drawing area is displayed as one large drawing sheet.
			 * @property ENDLESS
			 * @final
			 * @type {Number}
			 */
			ENDLESS: 0
		}
	}
}

module.exports = GraphSettings;
