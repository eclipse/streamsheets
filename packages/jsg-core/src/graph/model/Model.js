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
const JSG = require('../../JSG');
const AttributeList = require('../attr/AttributeList');
const EventDispatcher = require('./events/EventDispatcher');
const AttributeChangeEvent = require('./events/AttributeChangeEvent');

/**
 * Special AttributeList to manage attributes of an arbitrary graph item.<br/>
 * This list stores a reference to its GraphItem in its <code>item</code> property. The GraphItem,
 * if set, is used to trigger an {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}
 * on each attribute change.
 *
 *
 * @class Attributes
 * @extends AttributeList
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 * @constructor
 */
class Attributes extends AttributeList {
	constructor(mapExpr) {
		super('model.attributes', mapExpr);
		// the item to which this AttributeList belongs
		this.item = undefined;
	}

	// ROOT PATH IS EMPTY...
	getPath() {
		return '';
	}

	newInstance(mapExpr) {
		return new Attributes(mapExpr);
	}

	release() {
		this.item = undefined;
		super.release();
	}

	//
	// TODO work on different event handling! instead of passing an item reference when setting an
	// attribute value we simply pass call to parent list until we reached mode list :) here we can use
	// the registered item to fire an event!!
	//
	_addAttributeToList(attribute, list) {
		const event = this._createAttributeEvent(AttributeChangeEvent.ADD, list, attribute);
		this.sendPreEvent(event);
		if (event.doIt === true) {
			attribute = AttributeList.addAttributeToList(attribute, list);
			this.sendPostEvent(event);
		}
		JSG.attributeEventCache.release(event);
		return attribute;
	}

	_addAll(fromList, toList) {
		const event = this._createAttributeEvent(AttributeChangeEvent.BULK, toList, fromList);
		let changed = false;
		this.sendPreEvent(event);
		if (event.doIt === true) {
			changed = AttributeList.addAllNoEvent(fromList, toList);
			this.sendPostEvent(event);
		}
		JSG.attributeEventCache.release(event);
		return changed;
	}

	_removeAttributeFromList(attribute, list) {
		let removedAttr;
		if (attribute) {
			const event = this._createAttributeEvent(AttributeChangeEvent.REMOVE, list, attribute);
			this.sendPreEvent(event);
			if (event.doIt === true) {
				removedAttr = AttributeList.removeAttributeFromListNoEvent(attribute, list);
				this.sendPostEvent(event);
			}
			JSG.attributeEventCache.release(event);
		}
		return removedAttr;
	}

	_resetList(list) {
		const event = this._createAttributeEvent(AttributeChangeEvent.BULK, list);
		this.sendPreEvent(event);
		if (event.doIt === true) {
			AttributeList.resetList(list);
			this.sendPostEvent(event);
		}
		JSG.attributeEventCache.release(event);
	}

	setAttributeValue(attribute, value) {
		const changed = attribute && attribute.hasDifferentValue(value);
		if (changed) {
			// FIX: we store list, because for template attributes it might be replaced during event notification...
			const list = attribute._list;
			const event = this._createAttributeEvent(AttributeChangeEvent.VALUE, attribute, value);
			this.sendPreEvent(event);
			if (event.doIt === true) {
				AttributeList._setAttributeValue(attribute, value, list);
				this.sendPostEvent(event);
			}
			JSG.attributeEventCache.release(event);
		}
		return changed;
	}

	_createAttributeEvent(id, attribute, value) {
		const event = JSG.attributeEventCache.get(id, attribute, value);
		// const event = new AttributeChangeEvent(id, attribute, value);
		event.source = this.item;
		return event;
	}

	sendPreEvent(event) {
		if (this.item) {
			this.item.sendPreEvent(event);
		}
	}

	sendPostEvent(event) {
		if (this.item) {
			this.item.sendPostEvent(event);
		}
	}
}

class AttributeEventCache {
	constructor(size, maxsize) {
		this.events = [];
		this.size = size;
		this.maxsize = maxsize;

		let i;

		for (i = 0; i < size; i += 1) {
			this.events.push(new AttributeChangeEvent());
		}
	}

	get(id, attribute, value) {
		let i;
		let p;

		for (i = 0; i < this.size; i += 1) {
			p = this.events[i];
			if (!p.__used) {
				p.__used = true;
				if (attribute !== undefined && value !== undefined) {
					p.set(id, attribute, value);
				}
				return p;
			}
		}
		p = new AttributeChangeEvent();
		if (this.size < this.maxsize) {
			// add to cache...
			p.__used = true;
			this.events.push(p);
			this.size = this.events.length;
		} else {
			JSG.debug.log(`exceed maxsize (${this.maxsize}) of point cache!!`, JSG.debug.LOG_CACHE_WARNINGS);
		}

		if (attribute !== undefined && value !== undefined) {
			p.set(id, attribute, value);
		}
		return p;
	}

	// either pass point(s) to release or an array which contains the point(s) to release...
	release(...args) {
		let n = args.length;
		let i;
		let pt;

		if (n === 1 && Array.isArray(args[0])) {
			[args] = args;
			n = args.length;
		}

		for (i = 0; i < n; i += 1) {
			pt = args[i];
			if (pt) {
				if (pt.__used) {
					pt.__used = undefined;
				}
			}
		}
	}
}


/**
 * This module contains all model classes used to create graphs.</br>
 * A model object usually contains all the data required to represent both the model state and its appearance.
 * The actual visualization is done by a corresponding {{#crossLink "GraphItemView"}}{{/crossLink}}
 * which draws the model based on its {{#crossLink "FormatAttributes"}}{{/crossLink}}
 * and {{#crossLink "Shape"}}{{/crossLink}}.</br>
 * The relationship between a model and its view is defined by a
 * {{#crossLink "ModelController"}}{{/crossLink}} which also defines the model's behavior.
 * </br>
 * To easily build up any kind of graphs typical graph models like {{#crossLink "Graph"}}{{/crossLink}},
 * {{#crossLink "Node"}}{{/crossLink}}s and {{#crossLink "Edge"}}{{/crossLink}}s
 * are predefined. Please refer to the tutorial to see how to construct a Graph and its visual representation.
 * </br></br>
 * To get informed about changes in the model class, e.g. a format or attribute change, it is
 * possible to register {{#crossLink "EventListener"}}{{/crossLink}}s to
 * a model. Before the state of a model is changed each listener gets an
 * {{#crossLink "Event"}}{{/crossLink}} and only if none of the
 * registered listeners vetoes against by setting the Event
 * {{#crossLink "Event/doIt:property"}}{{/crossLink}} flag to <code>false</code>
 * the requested change takes place and the same event object is send a second time. See
 * {{#crossLink "Model/sendPreEvent:method"}}{{/crossLink}} and
 * {{#crossLink "Model/sendPostEvent:method"}}{{/crossLink}} too.</br>
 */

/**
 * Base class for any model item. This class is used as a generic base class for all
 * {{#crossLink "GraphItem"}}{{/crossLink}}s.
 *
 * @class Model
 * @constructor
 */
class Model {
	constructor() {
		this._id = undefined;
		this._eventHandler = new EventDispatcher();
		// MODEL ATTRIBUTES:
		this._modelAttributes = new Attributes();
		this._modelAttributes.item = this;
	}

	/**
	 * Creates a new model instance. </br>
	 * This method is part of our copy-pattern, in which the copy is initially created by
	 * <code>newInstance</code>. Therefore subclasses should overwrite.
	 *
	 * @method newInstance
	 * @return {Model} A new model instance.
	 */
	newInstance() {
		return new Model();
	}

	/**
	 * Creates a copy of this model.
	 *
	 * @method copy
	 * @return {Model} A copy of this model.
	 */
	copy(deep, ids) {
		const copy = this.newInstance();
		copy._modelAttributes = this._modelAttributes.copy();
		copy._modelAttributes.item = copy;
		if (ids) {
			copy._id = this._id;
		}

		return copy;
	}

	/**
	 * Should be called if this model is no longer used.<br/>
	 * Subclasses may overwrite to free up resources, but should call base implementation.<br/>
	 * Note: usually it is not required to call this method directly.
	 *
	 * @method dispose
	 * @since 2.2.17
	 */
	dispose() {
		this._modelAttributes.release();
	}

	/**
	 * Returns the inner AttributeList which contains all attributes currently added to this model.
	 *
	 * @method getModelAttributes
	 * @return {AttributeList} An AttributeList containing the Attributes currently added to this model.
	 */
	getModelAttributes() {
		return this._modelAttributes;
	}

	/**
	 * Returns the Attribute at specified path or <code>undefined</code> if none could be found.
	 *
	 * @method getAttributeAtPath
	 * @param {String} path A complete Attribute path, i.e. path includes Attribute name.
	 * @return {Attribute} The referenced Attribute or <code>undefined</code>
	 * if none could be found.
	 */
	getAttributeAtPath(path) {
		return AttributeList.findAttributeByPath(path, this._modelAttributes);
	}

	/**
	 * Returns the Attribute value at specified path or <code>undefined</code> if none could be found.
	 *
	 * @method getAttributeValueAtPath
	 * @param {String} path A complete Attribute path, i.e. path includes Attribute name.
	 * @return {String/Number/boolean} The referenced Attribute value or undefined if none could be found.
	 */
	getAttributeValueAtPath(path) {
		const attr = AttributeList.findAttributeByPath(path, this._modelAttributes);
		if (attr) {
			const value = attr.getExpression().getValue();
			// removed, as return  could be e.g. boolean
			// if (value && value.length) {
			return value;
			// }
		}
		return undefined;
	}

	/**
	 * Adds given Attribute to this model.</br>
	 * <b>Note:</b> this will replace any previous added Attribute with the same name!
	 *
	 * @method addAttribute
	 * @param {Attribute} attribute The Attribute to add.
	 * @return {Attribute} The added Attribute or <code>undefined</code> if
	 * attribute could not be added.
	 */
	addAttribute(attribute) {
		return this._modelAttributes.addAttribute(attribute);
	}

	/**
	 * Adds given Attribute to this model using specified path.</br>
	 * That means the path specifies the parent attribute to add the Attribute to.<br/>
	 * <b>Note:</b> this will replace any previous added Attribute for the same path!
	 *
	 * @method addAttributeAtPath
	 * @param {String} path The parent Attribute path.
	 * @param {Attribute} attribute The Attribute to add.
	 * @param {Boolean} [addParents] An optional flag to indicate that an <code>AttributeList</code> should be created
	 *     for each parent in given path if it does not exist.
	 * @return {Attribute} The added Attribute or <code>undefined</code> if
	 * attribute could not be added.
	 */
	addAttributeAtPath(path, attribute, addParents) {
		return AttributeList.addAttributeAtPath(path, attribute, this._modelAttributes, addParents);
	}

	/**
	 * Removes given Attribute from this model.
	 *
	 * @method removeAttribute
	 * @param {Attribute} attribute The Attribute to remove.
	 * @return {Attribute} The removed attribute as convenience or <code>undefined</code>.
	 */
	removeAttribute(attribute) {
		return this._modelAttributes.removeAttribute(attribute);
	}

	/**
	 * Removes the Attribute specified by given path.
	 *
	 * @method removeAttributeAtPath
	 * @param {String} path A complete Attribute path, i.e. path includes Attribute name.
	 * @return {Attribute} The removed Attribute or <code>undefined</code>
	 */
	removeAttributeAtPath(path) {
		let attribute = AttributeList.findAttributeByPath(path, this._modelAttributes);
		if (attribute) {
			const list = attribute.getAttributeList() || this._modelAttributes;
			attribute = this._modelAttributes._removeAttributeFromList(attribute, list);
		}
		return attribute;
	}

	/**
	 * Sets a new value or Expression to given model attribute.</br>
	 * To add or replace an attribute use {{#crossLink "Model/addAttribute:method"}}{{/crossLink}}.<br/>
	 *
	 * @method setAttribute
	 * @param {Attribute} attribute The attribute to set the value for.
	 * @param {BooleanExpression | Object} value The new attribute value or expression.
	 * return {Boolean} <code>true</code> if attribute value was set, <code>false</code> otherwise.
	 */
	setAttribute(attribute, value) {
		return this._modelAttributes.setAttributeValue(attribute, value);
	}

	/**
	 * Sets a new value or Expression to the model attribute specified by given path.</br>
	 * To add or replace an attribute at a specified path use {{#crossLink
	 * "Model/addAttributeAtPath:method"}}{{/crossLink}}.<br/>
	 *
	 * @method setAttributeAtPath
	 * @param {String} path A complete attribute path, i.e. a single path of attribute names.
	 * @param {BooleanExpression | Object} value The new attribute value or expression.
	 * return {Boolean} <code>true</code> if attribute value was set, <code>false</code> otherwise.
	 */
	setAttributeAtPath(path, value) {
		const attribute = AttributeList.findAttributeByPath(path, this._modelAttributes);
		return this.setAttribute(attribute, value);
	}

	/**
	 * Saves model Attributes.
	 *
	 * @method saveAttributes
	 * @param {Writer} writer Writer object to save to.
	 */
	saveAttributes(writer) {
		this._modelAttributes.save(writer);
	}

	readAttributes(reader, object) {
		const attributes = reader.getObject(object, 'al');
		if (attributes !== undefined) {
			this._modelAttributes.read(reader, attributes);
		}
	}

	/**
	 * Returns the unique id of this model.
	 *
	 * @method getId
	 * @return {Number} Return the unique id of the model item. The id will remain unchanged even after saving and
	 *     loading a graph.
	 */
	getId() {
		return this._id;
	}

	/**
	 * Set the unique id of the model item. This method should only be used internally by the system. Changing the
	 * unique id in a undefined way may lead to unpredictable results!
	 *
	 * @method setId
	 * @param {Number} id New id for the model item.
	 */
	setId(id) {
		this._id = id;
	}

	/**
	 * Save current model state. Default implementation does nothing.
	 *
	 * @method saveState
	 */
	saveState() {}

	/**
	 * Restore model state. Default implementation does nothing.
	 *
	 * @method restoreState
	 * @param {Object} state
	 */
	restoreState(state) {}

	/**
	 * Adds given event listener to the list of listeners which will be notified when an event with
	 * specified id occurs.
	 *
	 * @method addEventListener
	 * @param {String} eventid The event id to register listener for.
	 * @param {EventListener} listener The event listener to register.
	 */
	addEventListener(eventid, listener) {
		this._eventHandler.registerListener(eventid, listener);
	}

	/**
	 * Removes given event listener from the list of listeners which will be notified when an event with
	 * specified id occurs.
	 *
	 * @method removeEventListener
	 * @param {String} eventid The event id to deregister listener for.
	 * @param {EventListener} listener The event listener to remove.
	 */
	removeEventListener(eventid, listener) {
		this._eventHandler.unregisterListener(eventid, listener);
	}

	/**
	 * Sends given pre event to all listeners which are registered to the id of specified event.</br>
	 * <b>Note:</b> the event object is usually the same instance as later used in
	 * {{#Model/sendPostEvent:method"}}{{/crossLink}}. Therefore it is possible to
	 * attach custom data to the event.
	 *
	 * @method sendPreEvent
	 * @param {Event} event The event to send.
	 */
	sendPreEvent(event) {
		this._eventHandler.sendPreEvent(event);
	}

	/**
	 * Sends given post event to all listeners which are registered to the id of specified event.</br>
	 * <b>Note:</b> the event object is usually the same instance as used in
	 * {{#Model/sendPreEvent:method"}}{{/crossLink}}. Therefore it is possible to
	 * access any formerly attached custom data.
	 *
	 * @method sendPostEvent
	 * @param {Event} event The event to send.
	 */
	sendPostEvent(event) {
		this._eventHandler.sendPostEvent(event);
	}

	/**
	 * Returns <code>true</code> if events are enabled, otherwise <code>false</code>.
	 *
	 * @method areEventsEnabled
	 * @return {Boolean} true if events are enabled, false if not.
	 */
	areEventsEnabled() {
		return this._eventHandler.areEventsEnabled();
	}

	/**
	 * Enables event notification.
	 *
	 * @method enableEvents
	 * @param {Boolean} [doIt] An optional flag to specify if events should be enabled or disabled. Events are enabled
	 *     by default.
	 */
	enableEvents(doIt) {
		doIt = arguments.length > 0 ? !!doIt : true;
		if (doIt) {
			this._eventHandler.enableEvents();
		} else {
			this._eventHandler.disableEvents();
		}
	}

	/**
	 * Disables event notification, i.e. after calling this method any triggered event will not be propagated
	 * until {{#crossLink "Model/enableEvents:method"}}{{/crossLink}} is called again.
	 *
	 * @method disableEvents
	 * @return {Boolean} The events enabled state, i.e. <code>true</code> if events were enabled before,
	 *     <code>false</code> otherwise.
	 */
	disableEvents() {
		return this._eventHandler.disableEvents();
	}
}

JSG.attributeEventCache = new AttributeEventCache(20, 50);

module.exports = Model;
