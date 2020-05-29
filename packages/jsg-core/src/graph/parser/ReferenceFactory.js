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
const AttributeReference = require('./AttributeReference');
const GraphReference = require('./GraphReference');
const PropertiesProvider = require('../properties/PropertiesProvider');
const Strings = require('../../commons/Strings');

/**
 * An instance of this class is used to reference a certain property of a specified item.</br>
 * Pay attention to the fact that a Reference might not be resolved. In this case the inner used
 * GraphItem is undefined and the {{#crossLink "Reference/value:method"}}{{/crossLink}}
 * simply returns the string reference representation.
 * Note: item properties could be structured into different objects. That is why the third parameter
 * is required. The propertyObject actually holds the referenced property.
 *
 * @class Reference
 * @constructor
 * @param {GraphItem} item The referenced GraphItem model.
 * @param {String} property The referenced property.
 * @param {GraphItem|Object} propertyObject The object which actually provides the referenced property..
 */
module.exports = class ReferenceFactory {
	constructor(item, property, propertyObject) {
		this._item = item;
		this._property = property;
		this._propertyObject = propertyObject;
		this._str = undefined;
		// contains the raw string in case of an unresolved reference...
	}

	/**
	 * A factory method to create a new Reference instance for a given property, item and graph model.</br>
	 * Returns <code>undefined</code> if either the property reference string is not valid or a suitable
	 * GraphItem could not be determined.
	 *
	 * @example
	 *    var reference = Reference.fromString("width", undefined, anyGraphItem);
	 *
	 *
	 * @method fromString
	 * @param {String} str A String which references an item property.
	 * @param {Graph} [graph] An optional Graph model used to resolve item id within property string.
	 * @param {GraphItem} [item] An optional GraphItem model which is used as default property owner.
	 * @return {Reference} A new Reference or <code>undefined</code>.
	 * @static
	 */
	static fromString(str, graph, item) {
		const refstr = str;
		let unresolvedRef;

		const getItem = (lgraph, litem) => {
			let id;
			let cutIndex;
			let _item = litem;

			if (Strings.startsWith(str, 'Item.')) {
				cutIndex = str.indexOf('!');
				id = str.substring(5, cutIndex);
				// not yet resolved...
				unresolvedRef = new GraphReference();
				_item = ReferenceFactory._resolve(id, litem, lgraph);
				str = str.substring(cutIndex + 1);
			} else if (Strings.startsWith(str, 'Parent')) {
				cutIndex = str.indexOf('!');
				if (litem) {
					_item = litem.getParent();
					str = str.substring(cutIndex + 1);
					unresolvedRef = new GraphReference();
					// not yet resolved...
				}
			} else if (Strings.startsWith(str, 'Graph')) {
				cutIndex = str.indexOf('!');
				if (litem) {
					str = str.substring(cutIndex + 1);
					_item = lgraph || (litem ? litem.getGraph() : undefined);
					// not yet resolved...
					unresolvedRef = new GraphReference();
				}
			} else if (lgraph) {
				cutIndex = str.indexOf('!');
				if (cutIndex !== -1) {
					const name = str.substring(0, cutIndex);
					const namedItem = lgraph.getItemByName(name);
					if (namedItem) {
						// not yet resolved...
						unresolvedRef = new GraphReference();
						str = str.substring(cutIndex + 1);
						_item = namedItem;
					}
				}
			}
			return _item;
		};

		graph = graph || (item ? item.getGraph() : undefined);
		const _item = getItem(graph, item);
		if (_item) {
			const propertyId = str.toUpperCase();
			let ref = this.getReference(_item, propertyId);
			if (ref !== GraphReference.INVALID) {
				if (!ref && unresolvedRef) {
					ref = unresolvedRef;
					ref._str = refstr;
					ref._property = str;
					// here str contains property id only...
					// console.log("unresolved reference: " + ref._str);
				}
				return ref;
			}
		}
		return undefined;
	}

	static _resolve(id, item, graph) {
		let parent = item;
		const numId = Number(id);

		while (parent) {
			if (parent.getId() === numId) {
				return parent;
			}
			parent = parent.getParent();
		}

		if (graph === undefined) {
			graph = item.getGraph();
		}

		return graph.getItemById(numId);
	}

	/**
	 * Constructor method which creates a new Reference instance for given item and property specified by
	 * given propertyId. <code>undefined</code> is returned if given item has no property of given id.
	 *
	 * @method getReference
	 * @param {GraphItem} forItem The GraphItem model to create a Reference for.
	 * @param {String} propertyId A String representing an item property, like <code>WIDTH</code>,
	 *     <code>HEIGHT</code>...
	 * @return {Reference} A new Reference instance or <code>undefined</code>.
	 * @static
	 */
	static getReference(forItem, propertyId) {
		let property;
		let properties = PropertiesProvider.getProperties(forItem);

		if (properties) {
			property = properties.getProperty(propertyId);
			if (property) {
				return new GraphReference(forItem, property, forItem);
			}
		}

		properties = PropertiesProvider.getReshapeProperties(forItem);
		if (properties) {
			property = properties.getProperty(propertyId);
			if (property) {
				return new GraphReference(forItem, property, forItem);
			}
		}

		const attribute = forItem.getAttributeAtPath(propertyId);
		if (attribute) {
			return new AttributeReference(forItem, propertyId);
		}

		return forItem.getCustomReference(propertyId);
	}
};
