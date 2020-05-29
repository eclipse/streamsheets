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
const ObjectFactory = require('../../ObjectFactory');
const Dictionary = require('../../commons/Dictionary');
const Strings = require('../../commons/Strings');
const Attribute = require('./Attribute');
const MapExpressionUpperCase = require('../expr/MapExpressionUpperCase');
const AttributeChangeEvent = require('../model/events/AttributeChangeEvent');


/**
 * A container for <code>Attributes</code>. Methods to add and retrieve <code>Attributes</code> to and from this
 * <code>AttributeList</code> are provided.<br/>
 * It is allowed to nest different <code>AttributeLists</code> into another and to specify a special list which acts as
 * a parent for this <code>AttributeList</code>. The <code>Attributes</code> of a parent list are automatically
 * inherited, but not added to the sub list. That means that the sub list may be empty and only uses and returns
 * <code>Attributes</code> from its parent. So to look up an <code>Attribute</code> the <code>AttributeList</code> is
 * traversed first and if the search was not successful its parent is requested. <b>Note:</b> registering a parent has
 * an implication on the management of <code>Attributes</code>. E.g. a list can contain an <code>Attribute</code>
 * through its parent although it was not added before. On the other hand removing an <code>Attribute</code> will
 * only remove it from the sub list but not from its parent, i.e. the <code>Attribute</code> seems to be still within
 * the sub list namely because of its parent. Please refer to the documentation of the related methods.<br/>
 * To reference a parent list correctly it is required that both lists, i.e. the sub list and the parent list, are
 * attached to {{#crossLink "GraphItem"}}{{/crossLink}}s within the same
 * {{#crossLink "Graph"}}{{/crossLink}}.
 * If the parent should rather be a globally available list it is better to use
 * {{#crossLink "Template"}}{{/crossLink}}s
 * which can be accessed via {{#crossLink "TemplateStore"}}{{/crossLink}}.<br/>
 * <b>Note:</b> if this AttributeList is added to a GraphItem, either directly or indirectly via another AttributeList,
 * calling one of defined methods might raises an
 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}.
 *
 * @class AttributeList
 * @extends Attribute
 * @constructor
 * @param {String} name A unique name for this AttributeList
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
class AttributeList extends Attribute {
	constructor(name, mapExpr) {
		const value = mapExpr || new MapExpressionUpperCase();
		super(name, value);
		this._parent = undefined;
		value._list = this;
		// set parent of attributes in mapExpr....
		const attributes = value.getValue();

		attributes.forEach((attribute) => {
			attribute._list = this;
		});
	}

	newInstance(mapExpr) {
		return new AttributeList(this.getName(), mapExpr);
	}

	copy() {
		const copy = this.newInstance(this._value.copy());
		copy._parent = this._parent;
		return copy;
	}

	getClassString() {
		return 'JSG.AttributeList';
	}

	isList() {
		return true;
	}

	/**
	 * Returns the number of {{#crossLink "Attribute"}}s currently registered to this list.
	 *
	 * @method getSize
	 * @return {Number} Current list size.
	 * @since 1.6.43
	 */
	getSize() {
		return this._value.getSize();
	}

	/**
	 * Checks if this list contains any attributes. <b>Note:</b> this will not check its optional defined template! That
	 * means calling this method might return <code>true</code> although its template contains attributes.
	 *
	 * @method isEmpty
	 * @return {Boolean} <code>true</code> if this list contains no attribute or <code>false</code> otherwise.
	 */
	isEmpty() {
		return this._value.isEmpty();
	}

	/**
	 * Resets all attributes of this list.<br/>
	 * <b>Note:</b> if this list has a defined template, calling <code>reset</code> will remove all attributes which are
	 * already defined within its template. Furthermore, if this AttributeList is added to a GraphItem calling this
	 * method might raises an {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}.
	 *
	 * @method reset
	 */
	reset() {
		this._resetList(this);
	}

	_resetList(list) {
		const parent = this.getAttributeList();
		if (parent) {
			parent._resetList(list);
		} else {
			AttributeList.resetList(list);
		}
	}

	/**
	 * Checks if this list contains an attribute with the specified name.<br/>
	 * <b>Note:</b> by default an optional defined template is not checked! Use optional <code>checkTemplate</code>
	 * parameter to traverse the template hierarchy too.
	 *
	 * @method hasAttribute
	 * @param {String} name The name of the attribute to look for.
	 * @param {Boolean} [checkParent] Specify <code>true</code> to check parent hierarchy too.
	 * @return {Boolean} <code>true</code> if this list contains given attribute or <code>false</code> otherwise.
	 */
	hasAttribute(name, checkParent) {
		const contained = this._value.hasElement(name);
		return (
			contained ||
			(checkParent && this._parent
				? this._parent.hasAttribute(name, true)
				: false)
		);
	}

	/**
	 * Adds given Attribute to this list.<br/>
	 * <b>Note:</b> this will replace any previous added Attribute with the same name!<br/>
	 * Furthermore note: if this AttributeList is added to a GraphItem calling this method might raises an
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}.
	 *
	 * @method addAttribute
	 * @param {Attribute} attribute The Attribute to add.
	 * @return {Attribute} The added Attribute as convenience or <code>undefined</code>
	 * if attribute could not be added.
	 */
	addAttribute(attribute) {
		return this._addAttributeToList(attribute, this);
	}

	_addAttributeToList(attribute, list) {
		const parent = this.getAttributeList();
		if (parent) {
			return parent._addAttributeToList(attribute, list);
		}
		return AttributeList.addAttributeToList(attribute, list);
	}

	/**
	 * Returns the Attribute for the specified name or <code>undefined</code> if none could be found.<br/>
	 * Note: this method just looks for direct children of this AttributeList or within its template. To reference a
	 * deeper nested Attribute use <code>getAttributeAtPath</code>.
	 *
	 * @method getAttribute
	 * @param {String} name The name of the Attribute to get.
	 * @return {Attribute} The referenced Attribute or <code>undefined</code>
	 */
	getAttribute(name) {
		let attr = this._value.getElement(name);
		if (!attr && this._parent) {
			attr = this._parent.getAttribute(name);
			// dynamically change parent, so that attribute seems to be of our own => important for attributes from
			// template!
			if (attr) {
				attr._list = this;
			}
		}
		return attr;
	}

	/**
	 * Returns the attribute at specified path or <code>undefined</code> if none could be found.<br/>
	 * Note: the path must be relative to this AttributeList, i.e. the Attribute look up starts at this
	 * AttributeList. If not attribute s found and this list has a defined template it will be traversed too.
	 *
	 * @method getAttributeAtPath
	 * @param {String} path The path which reference wanted Attribute.
	 * @return {Attribute} The referenced Attribute or <code>undefined</code>
	 * if none could be found.
	 */
	getAttributeAtPath(path) {
		let attr = AttributeList.findAttributeByPath(path, this);
		if (!attr && this._parent) {
			attr = AttributeList.findAttributeByPath(path, this._parent);
			// dynamically change parent, so that attribute seems to be of our own => important for attributes from
			// template!
			if (attr) {
				attr._list = this;
			}
		}
		return attr;
	}

	/**
	 * Sets the value of the Attribute specified by given name.<br/>
	 * This method just looks for direct children of this AttributeList. To reference a deeper
	 * nested Attribute use <code>setAttributeAtPath</code>.<br/>
	 * <b>Note:</b> if the attribute to change is defined by a template, it will be copied into this list before its
	 * value is set. Setting its value back again to match the value defined by the template will not remove the
	 * attribute from this list. To remove it call
	 * {{#crossLink "AttributeList/reset:method"}}{{/crossLink}}.<br/>
	 * Furthermore, if this AttributeList is added to a GraphItem calling this method might raises an
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}.
	 *
	 * @method setAttribute
	 * @param {String} name The name of the Attribute to set the value of.
	 * @param {BooleanExpression | Object} value The new value or Expression for this Attribute.
	 * @return {Boolean} Returns <code>true</code> if value was changed, <code>false</code> otherwise.
	 */
	setAttribute(name, value) {
		let attribute = this._value.getElement(name);
		if (!attribute) {
			// get attribute from parent:
			attribute = this._parent
				? this._parent.getAttribute(name)
				: undefined;
			if (
				attribute &&
				!attribute.getExpression().isEqualToExpressionOrValue(value)
			) {
				// create new attribute:
				attribute = attribute.isConst
					? attribute.toAttribute()
					: attribute.copy();
				this.addAttribute(attribute);
			}
		}
		return attribute ? this.setAttributeValue(attribute, value) : false;
	}

	/**
	 * Adds given Attribute under specified path to given AttributeList.</br>
	 * That means the path must be relative to the AttributeList and specifies the parent to add the
	 * Attribute to.
	 *
	 * @method addAttributeAtPath
	 * @param {String} path The parent Attribute path.
	 * @param {JSG.graph.attr.Attribute} attribute The Attribute to add.
	 * @param {JSG.graph.attr.AttributeList} toAttributes The AttributeList to start the parent look up at.
	 * @param {Boolean} [addParents] An optional flag to indicate that each specified parent list within given path
	 *     should be created if it not exists.
	 * @return {JSG.graph.attr.Attribute} The added Attribute or undefined if attribute parent could
	 * not be found.
	 * @static
	 */
	static addAttributeAtPath(path, attribute, toAttributes, addParents) {
		let parent = AttributeList.findAttributeByPath(this._getParentPath(path, attribute), toAttributes);

		if (!parent && addParents) {
			const parts = path
				? path.split(Attribute.PATH_DELIMITER)
				: [];
			parent = AttributeList._lookUpAttribute(parts, toAttributes, addParents);
		}
		// const AttributeList = require('./AttributeList');
		if (parent instanceof AttributeList) {
			parent.addAttribute(attribute);
			return attribute;
		}

		return undefined;
	}

	static _getParentPath(path, attribute) {
		const name = attribute.getName();
		const cutIndex = path.indexOf(name, path.length - name.length);
		if (cutIndex !== -1) {
			// cut off attribute name...
			path = path.substring(0, cutIndex - 1);
		}
		return path;
	}

	/**
	 * Sets the value of the Attribute specified by given path.<br/>
	 * <b>Note:</b> if the attribute to change is defined by a template, it will be copied into the list which is
	 * specified by given path before its value is set. Setting its value back again to match the value defined by the
	 * template will not remove the attribute from this list. To remove it call
	 * {{#crossLink "AttributeList/reset:method"}}{{/crossLink}}.<br/>
	 * Furthermore, if this AttributeList is added to a GraphItem calling this method might raises an
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}.
	 *
	 * @method setAttributeAtPath
	 * @param {String} path The path of the Attribute to set the value of.
	 * @param {BooleanExpression | Object} value The new value or Expression for this Attribute.
	 * @return {Boolean} Returns <code>true</code> if value was changed, <code>false</code> otherwise.
	 */
	setAttributeAtPath(path, value) {
		let attribute = AttributeList.findAttributeByPath(path, this);
		if (!attribute) {
			// get attribute from parent:
			attribute = this._parent
				? AttributeList.findAttributeByPath(path, this)
				: undefined;
			if (
				attribute &&
				!attribute.getExpression().isEqualToExpressionOrValue(value)
			) {
				// create new attribute:
				attribute = attribute.isConst
					? attribute.toAttribute()
					: attribute.copy();
				this.addAttributeAtPath(path, attribute);
			}
		}
		return attribute ? this.setAttributeValue(attribute, value) : false;
	}

	/**
	 * Sets the value of given Attribute.<br/>
	 * <b>Note:</b> if the attribute to change is defined by a template, it will be copied into this list before i
	 * ts value is set. Setting its value back again to match the value defined by the template will not remove the
	 * attribute from this list. To remove it call
	 * {{#crossLink "AttributeList/reset:method"}}{{/crossLink}}.<br/>
	 * Furthermore, if this AttributeList is added to a GraphItem calling this method might raises an
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}.
	 *
	 * @method setAttributeValue
	 * @param {Attribute} attribute The Attribute to set the value of.
	 * @param {BooleanExpression | Object} value The new value or Expression for this Attribute.
	 * @return {Boolean} Returns <code>true</code> if value was changed, <code>false</code> otherwise.
	 */
	setAttributeValue(attribute, value) {
		const parent = this.getAttributeList();
		if (parent) {
			return parent.setAttributeValue(attribute, value);
		}
		return attribute
			? AttributeList._setAttributeValue(attribute, value)
			: false;
	}

	/**
	 * Sets the value of given attribute without raising an event.<br/>
	 * <b>Note: this is an API internal method!</b> Its usage is discouraged.
	 *
	 * @method setAttributeValue
	 * @param {Attribute} attribute The Attribute to set the value for.
	 * @param {BooleanExpression | Object} value The new value or Expression for this Attribute.
	 * @param {AttributeList} [list] The parent list of the attribute. If the passed attribute is of type
	 * {{#crossLink "ConstAttribute"}}{{/crossLink}} it will be copied, modified and added to this list.
	 * Therefore the parent list should be provided if possible.
	 * @return {Boolean} Returns <code>true</code> if value was changed, <code>false</code> otherwise.
	 * @static
	 * @private
	 */
	static _setAttributeValue(attribute, value, list) {
		let val = attribute.getExpression();
		if (!val.isEqualToExpressionOrValue(value)) {
			// check if attribute is defined by list or its parent. parent attributes must  be copied...
			list = list || attribute._list;
			if (list) {
				if (!list.hasAttribute(attribute.getName())) {
					// template or parent attribute:
					attribute = list.addAttribute(
						attribute.isConst === true
							? attribute.toAttribute()
							: attribute.copy()
					);
					val = attribute.getExpression();
				}
			}
			return val.setExpressionOrValue(value);
		}
		return false;
	}


	/**
	 * Removes given Attribute from this AttributeList.<br/>
	 * <b>Note:</b> if the attribute to remove is defined by a template, it might be deleted from this list, but never
	 * from the template. Therefore <code>undefined</code> is returned in such cases.<br/>
	 * Furthermore, if this AttributeList was added to a GraphItem calling this method might raises an
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}.
	 *
	 * @method removeAttribute
	 * @param {Attribute} attribute The Attribute to remove.
	 * @return {Attribute} The removed attribute as convenience or <code>undefined</code>.
	 */
	removeAttribute(attribute) {
		return this._removeAttributeFromList(attribute, this);
	}

	_removeAttributeFromList(attribute, list) {
		const parent = this.getAttributeList();
		if (parent) {
			return parent._removeAttributeFromList(attribute, list);
		}
		return AttributeList.removeAttributeFromListNoEvent(attribute, list);
	}

	/**
	 * Removes given attribute from specified attribute list without sending an event.<br/>
	 * <b>Note: this is an API internal method!</b> Its usage is discouraged.
	 *
	 * @method removeAttributeFromList
	 * @param {Attribute} attribute The Attribute to remove.
	 * @param {AttributeList} list The AttributeList to remove given Attribute from.
	 * @return {Attribute} The removed Attribute or <code>undefined</code> if given
	 * Attribute could not be removed.
	 * @static
	 * @private
	 */
	static removeAttributeFromListNoEvent(attribute, list) {
		const oldAttribute =
			attribute && list._value.removeElement(attribute.getName());
		if (oldAttribute !== undefined) {
			oldAttribute._list = undefined;
		}
		return oldAttribute;
	}

	/**
	 * Removes the Attribute specified by given path.<br/>
	 * <b>Note:</b> if the attribute to remove is defined by a template, it might be deleted from this list, but never
	 * from the template. Therefore <code>undefined</code> is returned in such cases.<br/>
	 * Furthermore, if this AttributeList was added to a GraphItem calling this method might raises an
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}.
	 *
	 * @method removeAttributeAtPath
	 * @param {String} path A path referencing the Attribute to remove.
	 * @return {Attribute} The removed Attribute or <code>undefined</code> if none was found.
	 */
	removeAttributeAtPath(path) {
		const attribute = AttributeList.findAttributeByPath(path, this);
		const parent = attribute ? attribute.getAttributeList() : undefined;
		return parent ? parent.removeAttribute(attribute) : undefined;
	}

	/**
	 * Retains only those Attributes in this list which have a corresponding Attribute in given AttributeList.
	 * An optional condition function can be passed to decide if matching Attributes should be retained or
	 * not.
	 *
	 * @example
	 *     var retainFunc = function(attr1, attr2) {
	 *         return (attr1 != undefined) && (attr2 != undefined) && attr1.getValue() == attr2.getValue();
	 *     }
	 *
	 * <b>Note:</b> this can only affect attributes which are contained in this list, i.e. if a template is registered
	 * to this list its attributes will neither be traversed nor changed!
	 *
	 * @method retainAll
	 * @param {AttributeList} attributeList An AttributeList containing the Attributes to retain.
	 * @param {Function} [condition] An optional condition Function.
	 * @return {Boolean} <code>true</code> if this AttributeList was changed, <code>false</code> otherwise.
	 */
	retainAll(attributeList, condition) {
		function defCondition(/* attr1, attr2 */) {
			return true;
		}

		let changed = false;
		const doRetain = condition || defCondition;
		const myAttributes = this._value.getValue();
		let otherAttribute;

		myAttributes.forEach((myAttribute) => {
			otherAttribute = attributeList.getAttribute(myAttribute.getName());
			if (!otherAttribute || !doRetain(myAttribute, otherAttribute)) {
				this.removeAttribute(myAttribute);
				changed = true;
			}
		});

		return changed;
	}

	// only valid for attribute list with no parent
	hasEqualDefinedValues(other) {
		let result = true;

		this.iterate((attribute) => {
			const myAttribute = other.getAttribute(attribute.getName());
			if (myAttribute && attribute) {
				if (attribute.getValue() !== myAttribute.getValue()) {
					result = false;
				}
			}
		});

		if (result) {
			other.iterate((attribute) => {
				const myAttribute = this.getAttribute(attribute.getName());
				if (myAttribute && attribute) {
					if (attribute.getValue() !== myAttribute.getValue()) {
						result = false;
					}
				}
			});
		}

		return result;
	}

	// add attributes from source to this, if not defined
	accumulate(source) {
		const addIf = (id, attr) => {
			// do not look in parent
			const myAttr = this._value.getElement(attr.getName());
			if (!myAttr) {
				this.addAttribute(attr.copy());
			}
		};

		source._value.iterate(addIf);
	}

	hasMapEqualDefinedValues(map) {
		let result = true;

		map.iterate((key, element) => {
			const attr = this.getAttribute(key);
			if (attr) {
				if (attr.getValue() !== element) {
					result = false;
				}
			}
		});

		return result;
	}

	isEqual(other, withParent) {
		const thisMap = this.toMap(withParent);
		const otherMap = other.toMap(withParent);
		let result;

		thisMap.iterate((key, value) => {
			const otherValue = otherMap.get(key);
			if (value.getValue() !== otherValue.getValue()) {
				result = false;
			}
		});

		return result === undefined;
	}

	/**
	 * Iterates over all attributes stored in this list and calls given function on each attribute. If provided function
	 * returns <code>true</code> iteration is stopped.<br/>
	 * Note: this will not iterate the attributes of this list's template.
	 *
	 * @method iterate
	 * @param {Function} func The function to call. Gets current attribute as parameter. Should return <code>true</code>
	 * to stop iteration.
	 */
	iterate(func) {
		function visit(id, attr) {
			func(attr);
		}

		this._value.iterate(visit);
	}

	/**
	 * Adds all the attributes of given list to this list.<br/>
	 * <b>Note:</b> this will replace any previous added Attribute with the same name!<br/>
	 * Furthermore note: if this AttributeList is added to a GraphItem calling this method might raises an
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}.
	 *
	 * @method addAll
	 * @param {AttributeList} fromList The list which provides the attributes to add.
	 * @return {Boolean} <code>true</code> if at least one attribute was added.
	 */
	addAll(fromList) {
		return this._addAll(fromList, this);
	}

	/**
	 * API internal method to add all attributes of given <code>fromList</code> to given <code>toList</code>.<br/>
	 *
	 * @method _addAll
	 * @param {AttributeList} fromList The list which provides the attributes to add.
	 * @param {AttributeList} toList The list to add the attributes to.
	 * @return {Boolean} <code>true</code> if at least one attribute was added.
	 * @private
	 */
	_addAll(fromList /* , toList */) {
		const parent = this.getAttributeList();
		if (parent) {
			return parent.addAll(fromList, this);
		}
		return AttributeList.addAllNoEvent(fromList, this);
	}

	/**
	 * Creates a so called flat list from this list. Flat means that all the attributes of a registered parent will be
	 * in the returned list too.
	 *
	 * @method toFlatList
	 * @param {AttributeList} fromList The list which provides the attributes to add.
	 * @return {AttributeList} A list which contains all attributes from this list including its parent
	 * attributes.
	 */
	toFlatList() {
		const list = this.newInstance();
		if (this._parent) {
			const pl = this._parent.toFlatList();
			list.addAll(pl);
		}
		// finally add our content:
		list.addAll(this);
		list.setParent(undefined);
		return list;
	}

	/**
	 * Creates a map of name/expression pairs for each stored attribute this list contains.<br/>
	 * If this list has a defined parent list, its attributes will not be part of returned map by default. Specify
	 * <code>true</code> to get the parent attributes too.<br/>
	 * <b>Note:</b> the attribute expressions are copied!
	 *
	 * @method toMap
	 * @param {Boolean} [withParent] Specify <code>true</code> to include parent attributes within returned map.
	 * @return {Dictionary} A map containing a name/expression pair for each attribute.
	 */
	toMap(withParent) {
		const map = new Dictionary();

		function mapIt(id, attr) {
			attr = attr.isConst ? attr.toAttribute() : attr;
			map.put(attr.getName(), attr.getExpression().copy());
		}

		if (withParent === true && this._parent) {
			map.putAll(this._parent.toMap(true));
		}
		this._value.iterate(mapIt);
		return map;
	}

	/**
	 * Creates an array of all attributes currently stored within this list.<br/>
	 * This overwrites the base class method {{#crossLink "Attribute/getValue:method"}}{{/crossLink}} to
	 * take an optional parent into account. I.e. if <code>true</code> is passed the attributes of a registered parent
	 * are added to returned array too.<br/>
	 *
	 * @method getValue
	 * @param {Boolean} [withParent] Specify <code>true</code> to include template parent attributes within returned
	 * array.
	 * @return {Array} An array of attributes this list contains.
	 */
	getValue(withParent) {
		const map = new Dictionary();

		function toMap(...args) {
			const attr = args.length === 2 ? args[1] : args[0];
			map.put(attr.getName(), attr);
		}

		if (withParent === true && this._parent) {
			this._parent.getValue(true).forEach(toMap);
		}
		this._value.iterate(toMap);
		return map.elements();
	}

	/**
	 * Sets the values of several attributes. The attributes to change and the values
	 * (or {{#crossLink "BooleanExpression"}}{{/crossLink}}s) to set are defined by the map
	 * which stores pairs of attribute names and values (or expressions respectively).<br/>
	 *
	 * @method applyMap
	 * @param {Dictionary} map A map which contains pairs of attribute names and values(expressions).
	 * @param {GraphItem} [item] If a GraphItem is passed calling this function will trigger
	 * an {{#crossLink "AttributeChangeEvent"}}{{/crossLink}} event with
	 * {{#crossLink "AttributeChangeEvent/BULK:property"}}{{/crossLink}}
	 * as detailId.
	 * @return {Boolean} <code>true</code> if at least one attribute was changed, <code>false</code> otherwise.
	 */
	applyMap(map, item) {
		let change = false;
		const event = this._sendPreEvent(map, item);
		const apply = (name, value) => {
			change = this.setAttribute(name, value) || change;
		};

		if (!event || event.doIt) {
			map.iterate(apply);
			if (item) {
				item.sendPostEvent(event);
			}
		}
		return change;
	}

	_sendPreEvent(map, item) {
		if (item) {
			const event = new AttributeChangeEvent(
				AttributeChangeEvent.BULK,
				this,
				map
			);
			item.sendPreEvent(event);
			return event;
		}
		return undefined;
	}

	/**
	 * Sets a new parent for this AttributeList.<br/>
	 * <b>Note:</b> to support store and restore parent correctly it is required that it is attached to a
	 * {{#crossLink "GraphItem"}}{{/crossLink}} within the same
	 * {{#crossLink "Graph"}}{{/crossLink}} as the <code>GraphItem</code> of this list belongs to.
	 * Otherwise if the parent is not attached to a <code>GraphItem</code>
	 * it should be an instance of {{#crossLink "Template"}}{{/crossLink}}.<br/>
	 * Finally note that it is allowed to pass <code>undefined</code> in order to remove any formerly applied parent.
	 *
	 * @method setParent
	 * @param {AttributeList} list The new parent list to use for this AttributeList. Specifying
	 * <code>undefined</code> is allowed.
	 */
	setParent(list) {
		this._parent = list;
		this._pl = undefined; // remove any previously stored reference...
	}

	/**
	 * Returns the currently used parent list for this AttributeList.<br/>
	 *
	 * @method getParent
	 * @return {AttributeList} The currently used parent or <code>undefined</code> if none was set.
	 */
	getParent() {
		return this._parent;
	}

	/**
	 * Creates a new template from this AttributeList.<br/>
	 *
	 * @method toTemplate
	 * @return {Template} A new template which contains all attributes currently within this
	 * AttributeList.
	 */
	toTemplate(name) {
		/* eslint-disable global-require */
		const Template = require('./Template');
		/* eslint-ensable global-require */
		const template = Template.fromList(this, name);
		if (this._pl) {
			// to resolve later...
			template._pl = this._pl;
		}
		return template;
	}

	// overwritten to resolve unresolved parent references...
	evaluate(item) {
		super.evaluate(item);
		// if we have an unresolved parent reference try to resolve it now:
		if (
			this._pl &&
			this._applyParent(
				AttributeList.resolveAttributeRef(this._pl, this),
				this._pl
			)
		) {
			this._pl = undefined;
		}
	}

	doSaveClassName() {
		return this.getClassString() !== AttributeList.CLASSNAME;
	}

	release() {
		function release(id, attr) {
			attr.release();
		}

		this._value._list = undefined;
		// call release on all attributes...
		this._value.iterate(release);
	}

	/**
	 * This method is called before the reference to a parent list is written to XML.<br/>
	 * Analog to {{#crossLink "Attribute/doSaveClassName:method"}}{{/crossLink}} or
	 * {{#crossLink "Attribute/doSaveDisplayName:method"}}{{/crossLink}} subclasses can override this
	 * method to decide if the parent reference should be written or not. E.g. if a list defines a default parent saving
	 * the reference might not be required.<br/>
	 * <b>Note:</b> a parent reference can only be created and stored if the parent list is either directly or
	 * indirectly connected to a {{#crossLink "GraphItem"}}{{/crossLink}}.<br/>
	 * Default implementation simply checks if a parent is registered to this list.
	 *
	 * @method doSaveParentRef
	 * @return {Boolean} <code>true</code> to save parent reference to XML, <code>false</code> otherwise.
	 */
	doSaveParentRef() {
		return !!this._parent;
	}

	readCondensed(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			let attr = this.getAttribute(name);
			if (attr) {
				attr = attr.isConst ? attr.toAttribute() : attr.copy(); // toList();
				attr.getExpression().read(reader, child);
				this.addAttribute(attr);
			}
		});
	}

	saveCondensed(writer, name) {
		if (this._transient) {
			return false;
		}
		const attributes = this._value.getValue();
		const savedAttributes = attributes.length;

		if (savedAttributes) {
			writer.writeStartElement(name);

			attributes.forEach((attr) => {
				attr.getExpression().save(attr.getName(), writer, 0);
			});

			writer.writeEndElement();
		}

		return savedAttributes;
	}

	/**
	 * Saves this <code>AttributeList</code>.<br/>
	 *
	 * @method save
	 * @param {Writer} writer Writer object to save to.
	 * @param {Function} [filter] An optional function to filter out attributes which should not be saved. This function
	 * should return <code>false</code> if passed attribute should not be saved.
	 * @return {Boolean} <code>true</code> if attribute was saved, <code>false</code> otherwise.
	 */
	save(writer, filter) {
		return this._save('al', writer, filter);
	}

	_save(tag, writer, filter) {
		let doSave = false;
		if (this._transient === false) {
			writer.writeStartElement(tag);
			this._writeAttribute('n', this.getName(), writer);
			this._saveTagAttributes(writer);
			// we only save non empty AttributeLists...
			doSave = this._saveValue(writer, filter);
			return writer.writeEndElement(!doSave);
		}
		return false;
	}

	_saveTagAttributes(xml) {
		let doSave = super._saveTagAttributes(xml);
		if (this.doSaveParentRef()) {
			this._writeAttribute(
				'pl',
				AttributeList.createAttributeRef(this._parent),
				xml
			);
			doSave = true;
		}
		return doSave;
	}

	// overwritten: don't want to save empty lists & pass a filter-function...
	_saveValue(writer, filter) {
		const attributes = this._value.getValue();
		let savedAttributes = false;
		writer.writeStartArray('al');

		attributes.forEach((attr) => {
			// we continue only if we filter returns false explicitly...
			if (!filter || filter(attr) === false) {
				if (attr instanceof AttributeList) {
					savedAttributes =
						this._saveAttributeList(attr, writer, filter) ||
						savedAttributes;
				} else {
					savedAttributes =
						this._saveAttribute(attr, writer) || savedAttributes;
				}
			}
		});

		writer.writeEndArray('al');
		return savedAttributes;
	}

	/**
	 * Saves an Attribute of this AttributeList.<br/>
	 * Can be overwritten by subclasses to perform custom saving of Attribute children.
	 *
	 * @method _saveAttribute
	 * @param {Attribute} attribute The Attribute to save.
	 * @param {Writer} writer Writer object to save to.
	 * @return {Boolean} <code>true</code> if Attribute was saved, <code>false</code> otherwise.
	 * @private
	 */
	_saveAttribute(attribute, writer) {
		if (this._overwritesParent(attribute)) {
			// for parent attributes we don't need to store classname, so:
			attribute._saveTagAttributes = this._saveTag;
		}
		// general save:
		return attribute.save(writer);
	}

	_overwritesParent(attribute) {
		if (this._parent) {
			return this._parent.getAttribute(attribute.getName());
		}
		return false;
	}

	_saveTag(writer) {
		this._writeAttribute(
			'dn',
			this.doSaveDisplayName() ? this.getDisplayName() : undefined,
			writer
		);
	}

	/**
	 * Saves an AttributeList which is part of this AttributeList.<br/>
	 * Can be overwritten by subclasses to perform custom saving of AttributeList children.
	 *
	 * @method _saveAttributeList
	 * @param {AttributeList} attrList The AttributeList to save.
	 * @param {Writer} writer Writer object to save to.
	 * @return {Boolean} <code>true</code> if AttributeList was saved, <code>false</code> otherwise.
	 * @private
	 */
	_saveAttributeList(attrList, writer, filter) {
		return attrList.save(writer, filter);
	}

	_readTagAttributes(reader, object) {
		super._readTagAttributes(reader, object);
		this._readParentTag(reader, object);
	}

	/**
	 * Reads the parent tag from given XML node. If a parent reference could be resolved it is set as new parent.
	 * If not the refereence is stored to try resolving it later via
	 * {{#crossLink "AttributeList/evaluate:method"}}{{/crossLink}}.<br/>
	 *
	 * @method _readParentTag
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 * @private
	 */
	_readParentTag(reader, object) {
		// legacy template support:
		let pl =
			reader.getAttribute(object, 'tl') ||
			reader.getAttribute(object, 'tid');
		let parent =
			pl && JSG.tmplStore ? JSG.tmplStore.getTemplate(pl) : undefined;

		if (!this._applyParent(parent, pl)) {
			pl = pl || reader.getAttribute(object, 'pl');
			parent = AttributeList.resolveAttributeRef(pl);
			this._applyParent(parent, pl);
		}
	}

	/**
	 * Checks if given parent is defined and if so use it as new parent for this list. If parent is not defined the
	 * optional given reference is stored to try resolving again via
	 * {{#crossLink "AttributeList/evaluate:method"}}{{/crossLink}}.
	 *
	 * @method _applyParent
	 * @param {AttributeList} [parent] The new parent AttributeList to set.
	 * @param {String} [ref] A parent reference to store for later resolve.
	 * @return {Boolean} <code>true</code> if either parent was set or reference stored, <code>false</code> otherwise.
	 * @private
	 */
	_applyParent(parent, ref) {
		if (parent) {
			this.setParent(parent);
		} else if (ref) {
			this._pl = ref;
			if (JSG.idUpdater.isActive && ref) {
				JSG.idUpdater.addAttributeList(this);
			}
		}
		return !!parent || !!ref;
	}

	_readValue(reader, object) {
		reader.iterateObjects(object, (name, child) => {
			const attribute = AttributeList.readAttribute(
				reader,
				name,
				child,
				this
			);
			if (attribute) {
				this.addAttribute(attribute);
			}
		});
	}

	/**
	 * Returns the GraphItem given Attribute is attached to.<br/>
	 *
	 * @method _getItem
	 * @param {Attribute} attribute The Attribute to get the item of.
	 * @return {GraphItem} The GraphItem given Attribute is attached to or <code>undefined</code>.
	 * @private
	 * @static
	 */
	static _getItem(attribute) {
		return attribute
			? attribute.item ||
					AttributeList._getItem(attribute.getAttributeList())
			: undefined;
	}

	static _itemId(idstr) {
		// are we in some kind of read process...
		const id = JSG.idUpdater.isActive
			? JSG.idUpdater.getId(idstr)
			: undefined;
		return id || parseInt(idstr, 10);
	}

	static _findItem(id, ctxt) {
		let parent;
		// if context is not an attribute, we assume it is a graph!!
		let graph = ctxt;
		if (ctxt && ctxt instanceof Attribute) {
			const item = AttributeList._getItem(ctxt);
			graph = item && item.getGraph();
			parent = item && item.getParentById(id);
		}
		return parent || (graph ? graph.getItemById(id) : undefined);
	}
	/**
	 * Tries to resolve given reference.<br/>
	 * Note: the optional <code>ctxt</code> parameter is used to resolve given reference and must be either an
	 * Attribute
	 * which is attached to a {{#crossLink "GraphItem"}}{{/crossLink}} or a {{#crossLink
	 * "Graph"}}{{/crossLink}} instance. For {{#crossLink "Template"}}{{/crossLink}}
	 * references this parameter is not required.
	 *
	 * @method resolveAttributeRef
	 * @param {String} ref The reference to resolve.
	 * @param {Attribute | Graph} [ctxt] Context parameter used for resolving. Not
	 *     required for Template references.
	 * @return {Attribute} Resolved Attribute or <code>undefined</code>.
	 * @static
	 */
	static resolveAttributeRef(ref, ctxt) {
		if (ref) {
			const cutIndex = ref.indexOf(':');
			const idstr = cutIndex > -1 ? ref.substring(0, cutIndex) : ref;
			if (idstr === 'tl') {
				return JSG.tmplStore.getTemplate(ref.substring(cutIndex + 1));
			}
			if (
				ctxt &&
				Strings.startsWith(idstr, '(') &&
				Strings.endsWith(idstr, ')')
			) {
				const id = AttributeList._itemId(
					idstr.substring(1, idstr.length - 1)
				);
				const item = AttributeList._findItem(id, ctxt);
				return item
					? item.getAttributeAtPath(ref.substring(cutIndex + 1))
					: undefined;
			}
		}
		return undefined;
	}

	static findAttributeByPath(path, inAttributes) {
		const parts = path
			? path.split(Attribute.PATH_DELIMITER)
			: [];
		return parts.length > 0
			? AttributeList._lookUpAttribute(parts, inAttributes)
			: undefined;
	}

	/**
	 * Resets given attribute list without sending an event.<br/>
	 * <b>Note: this is an API internal method!</b> Its usage is discouraged.
	 *
	 * @method resetList
	 * @param {AttributeList} list The AttributeList to reset.
	 * @static
	 * @private
	 */
	static resetList(list) {
		// each attribute which is in parent too, will be removed...
		// call reset on all others...
		const map = list._value;
		const parent = list._parent;

		function resetEl(id, el) {
			if (parent && parent.hasAttribute(id, true)) {
				map.removeElement(id);
			} else {
				el.reset();
			}
		}

		map.iterate(resetEl);
	}

	/**
	 * Adds given attribute to the specified attribute list without sending an event.<br/>
	 * <b>Note: this is an API internal method!</b> Its usage is discouraged.
	 *
	 * @method addAttributeToList
	 * @param {Attribute} attribute The Attribute to add.
	 * @param {AttributeList} list The AttributeList to add given Attribute to.
	 * @return {Attribute} The added Attribute.
	 * @static
	 * @private
	 */
	static addAttributeToList(attribute, list) {
		const oldAttribute = list._value.putElement(
			attribute.getName(),
			attribute
		);
		if (oldAttribute !== undefined && oldAttribute !== attribute) {
			oldAttribute._list = undefined;
		}
		attribute._list = list;
		return attribute;
	}

	static addAllNoEvent(fromList, toList) {
		let changed = false;
		const toValue = toList._value;

		function visit(id, attr) {
			const newAttribute = attr.copy();
			const oldAttribute = toValue.putElement(
				newAttribute.getName(),
				newAttribute
			);
			if (oldAttribute !== undefined && oldAttribute !== attr) {
				changed = true;
				oldAttribute._list = undefined;
			}
		}

		fromList._value.iterate(visit);
		return changed;
	}

	/**
	 * Creates a reference to given Attribute.<br/>
	 * Note: if the Attribute is not attached to a {{#crossLink "GraphItem"}}{{/crossLink}} and not
	 * represents a {{#crossLink "Template"}}{{/crossLink}} <code>undefined</code> will be returned.
	 *
	 * @method createAttributeRef
	 * @param {Attribute} attribute The Attribute to create a reference for.
	 * @return {String} The reference for the Attribute or <code>undefined</code>.
	 * @static
	 */
	static createAttributeRef(attribute) {
		if (attribute.isTemplate === true) {
			return `tl:${attribute.getName()}`;
		}
		const item = AttributeList._getItem(attribute);
		return item && item.getId()
			? `(${item.getId()}):${attribute.getPath()}`
			: undefined;
	}

	static readAttribute(reader, name, object, list) {
		let attribute;

		if (name === 'at' || name === 'al') {
			attribute = AttributeList._createAttributeFrom(reader, name, object, list);
			if (attribute !== undefined) {
				attribute.read(reader, object);
			}
		}
		return attribute;
	}

	static _createAttributeFrom(reader, name, object, list) {
		let attribute;
		const classname = reader.getAttribute(object, 'cl');

		if (classname) {
			attribute = ObjectFactory.create(classname);
		} else if (list) {
			attribute = list.getAttribute(reader.getAttribute(object, 'n'));
			// read-in/overwrite a parent/template attribute, so:
			if (attribute) {
				attribute = attribute.isConst
					? attribute.toAttribute()
					: attribute.copy(); // toList();
			}
		}
		if (attribute === undefined) {
			name = reader.getObject(object, 'vl') ? 'at' : 'al';
			attribute = AttributeList._createDefaultAttribute(name);
		}

		return attribute;
	}

	static _createDefaultAttribute(name) {
		let classname;
		if (name === 'at') {
			classname = Attribute.CLASSNAME;
		} else {
			classname =
				name === 'al'
					? AttributeList.CLASSNAME
					: undefined;
		}
		return classname ? ObjectFactory.create(classname) : undefined;
	}

	/**
	 * Looks up the Attribute specified by given path array, starting at given AttributeList.
	 *
	 * @method _lookUpAttribute
	 * @param {Array} path Path parts.
	 * @param {Boolean} [addAll] An optional flag to indicate that an <code>AttributeList</code> should be created for
	 *     each part of the path which does not exist.
	 * @return {Attribute} The referenced Attribute or <code>undefined</code> if none was found.
	 * @private
	 */
	static _lookUpAttribute(path, attributes, addAll) {
		if (path.length === 0 || attributes === undefined) {
			return attributes;
		}
		const name = path.shift();
		let attr;

		if (this._same(name, attributes.getName())) {
			attr = attributes;
		} else {
			attr =
				attributes instanceof AttributeList
					? attributes.getAttribute(name)
					: undefined;
		}

		if (!attr && addAll) {
			attr = attributes.addAttribute(new AttributeList(name));
		}
		return AttributeList._lookUpAttribute(path, attr, addAll);
	}

	static _same(name1, name2) {
		return name1 === name2 || name1.toUpperCase() === name2.toUpperCase();
	}


	/**
	 * The complete class name, i.e. including namespace.
	 *
	 * @property CLASSNAME
	 * @type {String}
	 * @static
	 * @final
	 */
	static get CLASSNAME() {
		return 'AttributeList';
	}
}

module.exports = AttributeList;
