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
const JSG = require('../JSG');
const ObjectAttribute = require('../graph/attr/ObjectAttribute');

/**
 * This class defines the general interface each <code>Layout</code> instance must fulfill in order to be used within
 * the JS Graph framework. Subclasses can extend this interface with additional methods and settings. All
 * <code>Layout</code>s are managed by the {{#crossLink "LayoutFactory"}}{{/crossLink}} which is
 * accessible via the global {{#crossLink "JSG/layoutFactory:property"}}{{/crossLink}} property.<br/><br/> A
 * <code>Layout</code> should manage its global settings individually. However, the
 * {{#crossLink "LayoutAttributes"}}{{/crossLink}} list of a {{#crossLink
 * "GraphItem"}}{{/crossLink}} can be used to store special, item dependent, layout preferences.
 * Therefore this package provides the
 * {{#crossLink "Settings"}}{{/crossLink}} class which can be used to store simple key-value pairs.
 * Subclass can override the corresponding methods {{#crossLink
 * "Layout/getSettings:method"}}{{/crossLink}} and {{#crossLink
 * "Layout/getInitialSettings:method"}}{{/crossLink}} to return customized settings objects. A
 * <code>Settings</code> object is automatically stored to {{#crossLink
 * "LayoutAttributes"}}{{/crossLink}} by using wrapping it inside an {{#crossLink
 * "ObjectAttribute"}}{{/crossLink}} class.<br/>
 * <b>Note:</b> each stored layout setting should be removed from the <code>LayoutAttributes</code> if the
 * corresponding
 * layout is no longer active. The {{#crossLink "Layout/registerSettings:method"}}{{/crossLink}} and
 * {{#crossLink "Layout/unregisterSettings:method"}}{{/crossLink}} methods are good places to store
 * and
 * remove custom settings from <code>LayoutAttributes</code>. This is automatically done for a <code>Settings</code>
 * object returned by {{#crossLink "Layout/getSettings:method"}}{{/crossLink}}.<br/> Finally note that
 * the <code>Layout</code> interface is designed in such a way that it is possible to use a single
 * <code>Layout</code> instance for several different <code>GraphItem</code>s. However this is not a mandatory.
 *
 * @example
 *      //activate custom EdgeLayout (App.Custom.EdgeLayout.Type) on myEdge, calls register(myEdge) internally:
 *      myEdge.setLayout(App.Custom.EdgeLayout.TYPE);
 *      //analog for a GraphLayout
 *      myGraph.setLayout(App.Custom.GraphLayout.TYPE);
 *      //get layout and its settings
 *      var layout = myEdge.getLayout();
 *      var settings = layout ? layout.getSettings(myEdge) : undefined;
 *      //layout graph, calls Layout.layout(graph) internally:
 *      myGraph.layout();
 *      //deactivate Edge- and GraphLayout, calls unregister(myEdge) internally:
 *      myEdge.setLayout(undefined);
 *      myGraph.setLayout(undefined);
 *
 *
 * @class Layout
 * @constructor
 * @since 1.6.18
 */
class Layout {
	/**
	 * Returns the unique type of this layout.
	 *
	 * @method getType
	 * @return {String} The layout type.
	 */
	getType() {
		return Layout.TYPE;
	}

	/**
	 * Checks if this layout instance is of given type.
	 *
	 * @method isTypeOf
	 * @param {String} type A layout type to check against.
	 * @return {Boolean} Returns <code>true</code> if this layout is of given type, <code>false</code> otherwise.
	 */
	isTypeOf(type) {
		return this.getType() === type;
	}

	/**
	 * Registers given <code>GraphItem</code> to this <code>Layout</code> and returns the <code>Layout</code> instance
	 * to which it was registered to.<br/>
	 * Called by framework if an instance of this <code>Layout</code> should be set to given <code>GraphItem</code>.
	 * Note: this method might return <code>undefined</code>.
	 *
	 * @method register
	 * @param  {GraphItem} graphitem The <code>GraphItem</code> to register to this a
	 *     <code>Layout</code>.
	 * @return {Layout} The <code>Layout</code> instance to use for given <code>GraphItem</code> or
	 * <code>undefined</code>.
	 * @static
	 */
	register(graphitem) {
		const layoutattr = graphitem.getLayoutAttributes();
		layoutattr.setLayout(this.getType());
		this.registerSettings(graphitem);
		return this;
	}

	/**
	 * Called by framework on layout registration to store custom layout settings for given <code>GraphItem</code>.
	 * By default this method tries to get a {{#crossLink "Settings"}}{{/crossLink}} object via
	 * {{#crossLink "Layout/getSettings:method"}}{{/crossLink}} or
	 * {{#crossLink "Layout/getInitialSettings:method"}}{{/crossLink}} and stores it within
	 * <code>GraphItem</code>s
	 * {{#crossLink "LayoutAttributes"}}{{/crossLink}}.<br/>
	 * Subclasses may overwrite this to implement custom behaviour.
	 * @method registerSettings
	 * @param {GraphItem} graphitem The <code>GraphItem</code> to register layout settings for.
	 * @param {Settings} [settings] An optional <code>Settings</code> object to register. If not
	 *     defined a default settings object is used.
	 * @since 2.0.7
	 */
	registerSettings(graphitem, settings) {
		const initial = this.getInitialSettings(graphitem);
		settings = settings || this.getSettings(graphitem);
		if (settings) {
			// merge...
			initial.addAll(settings);
		}
		this._storeSettings(graphitem, initial);
	}

	_storeSettings(graphitem, settings) {
		const layoutattr = graphitem.getLayoutAttributes();
		const attr =
			layoutattr.getAttribute('settings') || layoutattr.addAttribute(new ObjectAttribute('settings', settings));
		attr.setExpressionOrValue(settings);
	}

	/**
	 * Unregisters given <code>GraphItem</code> from this <code>Layout</code> instance.<br/>
	 * Called by framework if this <code>Layout</code> is removed from given <code>GraphItem</code>.
	 *
	 * @method unregister
	 * @param  {GraphItem} graphitem The <code>GraphItem</code> to unregister.
	 */
	unregister(graphitem) {
		const layoutattr = graphitem.getLayoutAttributes();
		layoutattr.setLayout('None');
		this.unregisterSettings(graphitem);
	}

	/**
	 * Called by framework if layout registration should be removed from given <code>GraphItem</code>.
	 * By default this method tries to remove a previous stored {{#crossLink "Settings"}}{{/crossLink}}
	 * object from <code>GraphItem</code>s {{#crossLink "LayoutAttributes"}}{{/crossLink}}.<br/>
	 * Subclasses may overwrite this to implement custom behaviour.
	 * @method unregisterSettings
	 * @param {GraphItem} graphitem The <code>GraphItem</code> to remove layout settings for.
	 * @since 2.0.7
	 */
	unregisterSettings(graphitem) {
		const layoutattr = graphitem.getLayoutAttributes();
		layoutattr.removeAttributeAtPath('settings');
	}

	/**
	 * Checks if this <code>Layout</code> is enabled for given <code>GraphItem</code>.
	 *
	 * @method isEnabled
	 * @param  {GraphItem} graphitem The <code>GraphItem</code> to check for.
	 * @return {Boolean} Returns <code>true</code> if <code>Layout</code> is enabled for given <code>GraphItem</code>,
	 * <code>false</code> otherwise.
	 */
	isEnabled(graphitem) {
		const layoutattr = graphitem.getLayoutAttributes();
		return layoutattr.isEnabled();
	}

	/**
	 * Enables or disables this <code>Layout</code> for given <code>GraphItem</code>.
	 *
	 * @method setEnabled
	 * @param  {GraphItem} graphitem The <code>GraphItem</code> to set enabled state for.
	 * @return {Boolean} Returns old enable state.
	 */
	setEnabled(graphitem, doIt) {
		const enabled = this.isEnabled(graphitem);
		if (enabled !== doIt) {
			const layoutattr = graphitem.getLayoutAttributes();
			layoutattr.setEnabled(doIt);
		}
		return enabled;
	}

	/**
	 * Returns a <code>Layout</code> dependent settings object for given <code>GraphItem</code>. Note that this method
	 * can return <code>undefined</code>.
	 *
	 * @method getSettings
	 * @param {GraphItem} graphitem The <code>GraphItem</code> to get the <code>Layout</code> settings
	 *     for.
	 * @return {Settings} A <code>Layout</code> dependent settings object or <code>undefined</code>.
	 */
	getSettings(graphitem) {
		const layoutattr = graphitem.getLayoutAttributes();
		const settings = layoutattr.getAttribute('settings');
		return settings ? settings.getValue() : undefined;
	}

	/**
	 * Returns a <code>Layout</code> dependent settings object which provides default values. Note this method can
	 * return <code>undefined</code>.
	 *
	 * @method getDefaultSettings
	 * @param {GraphItem} graphitem The <code>GraphItem</code> to get the default settings for.
	 * @return {Settings} A <code>Layout</code> dependent settings object which contains default
	 *     settings.
	 * @deprecated Not used anymore and therefore subject to be removed! Default handling is completely the
	 *     responsibility of layout implementation and its settings. The framework uses
	 * {{#crossLink "Layout/getInitialSettings:method"}}{{/crossLink}} to create an initial settings
	 *     object if none is available.
	 */
	getDefaultSettings(graphitem) {
		return undefined;
	}

	/**
	 * Returns an initial <code>Layout</code> dependent settings object. This method is always called if no settings
	 * object is available for specified <code>GraphItem</code>. Note this method can return <code>undefined</code>.
	 * @method getInitialSettings
	 * @param {GraphItem} graphitem The <code>GraphItem</code> to get the initial settings for.
	 * @return {Settings} A <code>Layout</code> dependent settings object which contains initial
	 *     layout
	 * settings.
	 * @since 2.0.7
	 */
	getInitialSettings(graphitem) {
		return undefined;
	}

	/**
	 * Called when the <code>Layout</code> should arrange the sub-items of given <code>GraphItem</code>.<br/>
	 * Please note that the {{#crossLink "Layout/preLayout:method"}}{{/crossLink}} and
	 * {{#crossLink "Layout/postLayout:method"}}{{/crossLink}} methods are called before and
	 * afterwards.
	 *
	 * @method layout
	 * @param {GraphItem} graphitem The <code>GraphItem</code> to lay out.
	 * @param {Boolean} [forceNodeLayout] Specify <code>true</code> or <code>undefined</code> to force the current
	 *     <code>Layout</code> to be executed.
	 * @return {Boolean} Returns <code>true</code> if <code>GraphItem</code> was laid out, <code>false</code>
	 *     otherwise.
	 */
	layout(graphitem, forceNodeLayout) {
		return false;
	}

	/**
	 * Invoked by the framework before each call to {{#crossLink
	 * "Layout/layout:method"}}{{/crossLink}}.
	 *
	 * @method preLayout
	 * @param {GraphItem} graphitem The <code>GraphItem</code> to lay out.
	 */
	preLayout(graphitem) {}

	/**
	 * Invoked by the framework after each call to {{#crossLink "Layout/layout:method"}}{{/crossLink}}.
	 *
	 * @method preLayout
	 * @param {GraphItem} graphitem The laid out <code>GraphItem</code>.
	 */
	postLayout(graphitem) {}

	/**
	 * The unique layout type.
	 *
	 * @property TYPE
	 * @type {String}
	 * @static
	 */
	static get TYPE() {
		return 'jsg.abstract.layout';
	}
}

module.exports = Layout;
