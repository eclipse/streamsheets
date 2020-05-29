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
// const JSG = require('../../JSG');
const Expression = require('../expr/Expression');

/**
 * Attributes provide a flexible mechanism to attach arbitrary values to an instance of
 * {{#crossLink "Model"}}{{/crossLink}}. An Attribute simply defines a name-value
 * pair in which the value is given as an {{#crossLink "BooleanExpression"}}{{/crossLink}}.<br/>
 * Attributes can be grouped by adding them to an {{#crossLink "AttributeList"}}{{/crossLink}}.
 * Note that it is allowed to nest AttributeLists into each other. So it is possible to construct
 * hierarchies out of Attributes and AttributeLists. To reference an Attribute or an AttributeList within
 * such a hierarchy a unique path is build by using the Attribute names. Hence, it is a mandatory that
 * the Attribute name should be unique, at least within its containing AttributeList.<br/>
 * AttributeLists also support the concept of inheritance, i.e. it is possible to register a parent list. That means if
 * an AttributeList has a parent it automatically inherits the attributes defined within its parent list but without
 * adding them, i.e. the list itself may be empty. This feature is used to support
 * {{#crossLink "Template"}}{{/crossLink}}s
 * which are globally accessible via a {{#crossLink "TemplateStore"}}{{/crossLink}}. A Template simply
 * defines a list of immutable Attributes which can be set as a parent to any AttributeList.<br/>
 * So nesting AttributeLists is a sort of categorization whereas a parent list defines simple inheritance of Attributes.
 */

/**
 * Creates a new Attribute with given name and value.<br/>
 * <b>Note:</b> to prevent conflicts with other Attributes the Attribute name should be globally
 * unique, at least within its parent AttributeList.<br/>
 *
 * @class Attribute
 * @constructor
 * @param {String} name A unique Attribute name.
 * @param {BooleanExpression} value An Attribute value expression
 */
class Attribute {
	constructor(name, value) {
		this._name = undefined;
		this._value = value || new Expression();
		this._dplname = undefined;
		this._list = undefined;
		this._transient = false;
		this._setName(name);
	}

	/**
	 * Returns the complete class String of this Attribute instance. The class String is the name
	 * of the Attribute instance including its complete path, e.g. the class String of this general Attribute is
	 * <code>Attribute</code>.<br/>
	 *
	 * @method getClassString
	 * @return {String} The complete class String of this Attribute instance.
	 */
	getClassString() {
		return Attribute.CLASSNAME;
	}

	isList() {
		return false;
	}

	/**
	 * Returns the path of this Attribute.<br/>
	 * If this attribute does not belong to an {{#crossLink "AttributeList"}}{{/crossLink}}
	 * the path is simply the unique name of this attribute. Otherwise the path is the concatenation of the
	 * AttributeList path and the attribute name.
	 *
	 * @method getPath
	 * @return {String} The path of this Attribute.
	 */
	getPath() {
		let parentPath = this._list ? this._list.getPath() : '';
		if (parentPath.length > 0) {
			parentPath += Attribute.PATH_DELIMITER;
		}
		return parentPath + this.getName();
	}

	/**
	 * Checks if this <code>Attribute</code> is equal to given one.</br>
	 * Both attributes are equal if they have the same name and value
	 * {{#crossLink "BooleanExpression"}}{{/crossLink}}.
	 *
	 * @method isEqualTo
	 * @param {Attribute} other The <code>Attribute</code> to check against.
	 * @return {Boolean} Returns <code>true</code> if both attributes have same name and <code>Expression</code>,
	 * <code>false</code> otherwise.
	 * @since 1.6.43
	 */
	isEqualTo(other) {
		let equal = !!other;
		equal = equal && this.getName() === other.getName();
		equal = equal && this.getExpression().isEqualTo(other.getExpression());
		return equal;
	}

	/**
	 * Returns the unique name of this Attribute.<br/>
	 *
	 * @method getName
	 * @return {String} The Attribute name.
	 */
	getName() {
		return this._name;
	}

	/**
	 * Internal method to set the Attribute name.
	 *
	 * @method _setName
	 * @param {String} name The new Attribute name.
	 * @private
	 */
	_setName(name) {
		if (name) {
			this._name = name.replace(Attribute.PATH_DELIMITER, '');
		}
	}

	/**
	 * Returns the display name to use for this Attribute.<br/>
	 * Note: in contrast to the Attribute name the display name does not need to be unique and might
	 * change.
	 *
	 * @method getDisplayName
	 * @return {String} The display name to use for this Attribute.
	 */
	getDisplayName() {
		return this._dplname;
	}

	/**
	 * Sets the display name to use for this Attribute.<br/>
	 * Note: in contrast to the Attribute name the display name does not need to be unique and might
	 * change.
	 *
	 * @method setDisplayName
	 * @param {String} name The new display name.
	 */
	setDisplayName(name) {
		this._dplname = name;
	}

	/**
	 * Checks if this Attribute is marked as transient.<br/>
	 * Note: Attributes marked as transient are not saved.
	 *
	 * @method isTransient
	 * @return {Boolean} <code>true</code> if this Attribute is marked as transient, <code>false</code> otherwise.
	 */
	isTransient() {
		return this._transient;
	}

	/**
	 * Marks this Attribute as transient or not.<br/>
	 * Note: Attributes marked as transient are not saved.
	 *
	 * @method setTransient
	 * @param {Boolean} transient Set to <code>true</code> to mark this Attribute as transient, to <code>false</code>
	 * otherwise.
	 */
	setTransient(transient) {
		this._transient = transient === true;
	}

	/**
	 * Creates a new Attribute instance. <br/>
	 * This method is part of our copy-pattern, in which a copy is initially created by
	 * <code>newInstance</code>. Therefore subclasses should overwrite this method.
	 *
	 * @method newInstance
	 * @return {Attribute} A new Attribute instance.
	 */
	newInstance() {
		return new Attribute(this.getName());
	}

	/**
	 * Creates a copy of this Attribute.
	 *
	 * @method copy
	 * @return {Attribute} A copy of this Attribute.
	 */
	copy() {
		const copy = this.newInstance();
		copy._list = this._list;
		copy._value = this._value.copy();
		copy._setName(this.getName());
		copy.setTransient(this.isTransient());
		copy.setDisplayName(this.getDisplayName());
		return copy;
	}

	/**
	 * Returns the AttributeList which contains this Attribute or <code>undefined</code> if this Attribute
	 * does not belong to an AttributeList
	 *
	 * @method getAttributeList
	 * @return {AttributeList} The AttributeList this Attribute belongs to
	 * or <code>undefined</code>
	 */
	getAttributeList() {
		return this._list;
	}

	/**
	 * Returns direct access to the Attributes value Expression.<br/>
	 * See {{#crossLink "Attribute/getValue:method"}}{{/crossLink}} to
	 * get the value defined by this Expression.
	 *
	 * @method getExpression
	 * @return {BooleanExpression} The current value Expression.
	 */
	getExpression() {
		return this._value;
	}

	/**
	 * Returns the Attribute value which is defined by the Attributes value Expression.<br/>
	 * See {{#crossLink "Attribute/getExpression:method"}}{{/crossLink}} to
	 * get the Expression which defines the Attribute value.
	 *
	 * @method getValue
	 * @return {Object} The current value.
	 */
	getValue() {
		return this._value.getValue();
	}

	/**
	 * Sets the Attributes value Expression.<br/>
	 * Consider that if this attribute belongs to an {{#crossLink "AttributeList"}}{{/crossLink}} which
	 * is part of a GraphItem attributes hierarchy, a corresponding
	 * {{#crossLink "AttributeChangeEvent"}}{{/crossLink}}
	 * is raised.<br/>
	 *
	 * @method setExpressionOrValue
	 * @param {BooleanExpression | Object} value The new value or Expression for this Attribute.
	 * @return {Boolean} Returns <code>true</code> if value was changed, <code>false</code> otherwise.
	 */
	setExpressionOrValue(value) {
		return this._list
			? this._list.setAttributeValue(this, value)
			: Attribute.setAttributeValue(this, value);
	}

	static setAttributeValue(attribute, value, list) {
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
	 * Checks if given expression or value is different from current attribute value/expression.<br/>
	 * <b>Note:</b> the passed expression or value must be valid otherwise always <code>false</code> is
	 * returned.
	 *
	 * @method hasDifferentValue
	 * @param {BooleanExpression | Object} value The value or expression to check.
	 * @return {Boolean} Returns <code>true</code> if value or expression is different from current one,
	 * <code>false</code> otherwise.
	 */
	hasDifferentValue(value) {
		return !this._value.isEqualToExpressionOrValue(value);
	}

	/**
	 * Replaces currently used value Expression with specified one.
	 *
	 * @method replaceValueExpression
	 * @param {BooleanExpression} newexpr The new Expression to use for this Attribute value.
	 * @return {Boolean} <code>true</code> if new Expression was set, <code>false</code> otherwise.
	 */
	replaceValueExpression(newexpr) {
		const setIt = newexpr && !this._value.isEqualTo(newexpr);
		if (setIt === true) {
			this._value = newexpr;
		}
		return setIt;
	}

	/**
	 * Resets this Attribute with given default value. If no value is passed, this implementation does nothing.<br/>
	 * Note: this method can be overwritten by subclasses to implement custom behavior.
	 *
	 * @method reset
	 * @param {Object} [defValue] An optional default value to reset this Attribute with.
	 */
	reset(defValue) {
		if (defValue) {
			this.setExpressionOrValue(defValue);
		}
	}

	/**
	 * Evaluates this Attribute using an optional GraphItem.
	 *
	 * @method evaluate
	 * @param {GraphItem} [item] Used to resolve references within Attribute value Expression.
	 */
	evaluate(item) {
		this._value.evaluate(item);
	}

	invalidateTerm() {
		this._value.invalidateTerm();
	}

	/**
	 * Resolves parent references within the attribute's value Expression.<br/>
	 * The passed GraphItem is used to resolve parent reference and the optional <code>doRemove</code>
	 * flag can be used to clear the complete Expression formula.
	 *
	 * @method resolveParentReference
	 * @param {GraphItem} item Used to resolve parent reference.
	 * @param {Boolean} [doRemove] Specify <code>true</code> to remove value Expression formula completely.
	 */
	resolveParentReference(item, doRemove) {
		this._value.resolveParentReference(item, doRemove);
	}

	/**
	 * Should be called if this attribute is no longer used.<br/>
	 * Subclasses may overwrite to free up resources, but should call base implementation.<br/>
	 * Note: usually it is not required to call this method directly.
	 *
	 * @method release
	 * @since 2.2.17
	 */
	release() {
		this._list = undefined;
	}

	/**
	 * Saves this Attribute.<br/>
	 * <b>Note:</b> custom attributes should overwrite
	 * {{#crossLink "Attribute/_saveTagAttributes:method"}}{{/crossLink}} and
	 * {{#crossLink "Attribute/_saveValue:method"}}{{/crossLink}} to save
	 * their value.
	 *
	 * @method save
	 * @param {Writer} file Writer object to save to.
	 * @return {Boolean} <code>true</code> if attribute was saved, <code>false</code> otherwise.
	 */
	save(file) {
		return this._save('at', file);
	}

	/**
	 * Performs the actual saving of this Attribute.<br/>
	 * Usually it is not required to overwrite this method. Instead subclasses should overwrite
	 * {{#crossLink "Attribute/_saveTagAttributes:method"}}{{/crossLink}} and
	 * {{#crossLink "Attribute/_saveValue:method"}}{{/crossLink}} to
	 * save Attribute value.
	 *
	 * @method _save
	 * @param {String} tag The Attribute tag name.
	 * @param {Writer} file Writer object to save to.
	 * @return {Boolean} <code>true</code> if attribute was saved, <code>false</code> otherwise.
	 * @private
	 */
	_save(tag, file) {
		let doSave = false;
		if (this._transient === false) {
			file.writeStartElement(tag);
			this._writeAttribute('n', this.getName(), file);
			doSave = this._saveTagAttributes(file);
			doSave = this._saveValue(file) || doSave;
			return file.writeEndElement(!doSave);
		}
		return false;
	}

	/**
	 * Writes optional attributes to the start tag for this Attribute. The saved attributes are
	 * used in {{#crossLink "Attribute/_readTagAttributes:method"}}{{/crossLink}} to
	 * create an instance of this attribute.<br/>
	 * By default this method writes the display name, the class name and the type of this Attribute.<br/>
	 * Subclasses might overwrite to customize saving.
	 *
	 * @method _saveTagAttributes
	 * @param {Writer} writer Writer object to save to.
	 * @private
	 */
	_saveTagAttributes(writer) {
		this._writeAttribute(
			'dn',
			this.doSaveDisplayName() ? this.getDisplayName() : undefined,
			writer
		);
		this._writeAttribute(
			'cl',
			this.doSaveClassName() ? this.getClassString() : undefined,
			writer
		);
	}

	/**
	 * Writes given tag and value.
	 *
	 * @method _writeAttribute
	 * @param {String} tag A tag name.
	 * @param {String} valstr The value to write as string.
	 * @param {Writer} writer Writer object to save to.
	 * @private
	 */
	_writeAttribute(tag, valstr, writer) {
		if (valstr) {
			writer.writeAttributeString(tag, valstr);
		}
	}

	/**
	 * This method is called before the display name field is written to XML.<br/>
	 * Subclasses can override this method to decide if this field should be written or not. Default
	 * implementation simply returns <code>true</code>.
	 *
	 * @method doSaveDisplayName
	 * @return {Boolean} <code>true</code> to save display name to XML, <code>false</code> otherwise.
	 */
	doSaveDisplayName() {
		return true;
	}

	/**
	 * This method is called before the class name field is written to XML.<br/>
	 * Subclasses can override this method to decide if this field should be written or not. Default
	 * implementation simply checks current class name against
	 * {{#crossLink "Attribute/CLASSNAME:property"}}{{/crossLink}}.
	 *
	 * @method doSaveClassName
	 * @return {Boolean} <code>true</code> to save class name to XML, <code>false</code> otherwise.
	 */
	doSaveClassName() {
		return this.getClassString() !== Attribute.CLASSNAME;
	}

	/**
	 * Saves the Attributes value.<br/>
	 * Subclasses can overwrite to perform custom value save.
	 *
	 * @method _saveValue
	 * @param {Writer} writer Writer object to save to.
	 * @return {Boolean} <code>true</code> if a value was written, <code>false</code> otherwise.
	 * @private
	 */
	_saveValue(writer) {
		this._value.save('vl', writer);
		return true;
	}

	/**
	 * Reads Attribute content.<br/>
	 * <b>Note:</b> custom attributes should overwrite <code>_readValue</code> to read their custom value.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		this._setName(reader.getAttribute(object, 'n'));
		this._readTagAttributes(reader, object);
		this._readValue(reader, object);
	}

	/**
	 * Reads the attributes of the main XML tag for this Attribute.<br/>
	 * Subclasses can overwrite to perform custom reading.
	 *
	 * @method _readTagAttributes
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 * @private
	 */
	_readTagAttributes(reader, object) {
		this.setDisplayName(reader.getAttribute(object, 'dn'));
	}

	/**
	 * Reads the Attribute value.<br/>
	 * Subclasses can overwrite to perform custom reading.
	 *
	 * @method _readValue
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 * @private
	 */
	_readValue(reader, object) {
		const value = reader.getObject(object, 'vl');
		if (value) {
			this.getExpression().read(reader, value);
		}
	}

	/**
	 * The attribute path delimiter definition.<br/>
	 * <b>Note:</b> the delimiter should not be used inside attribute name!
	 * @property PATH_DELIMITER
	 * @type {String}
	 * @static
	 * @final
	 */
	static get PATH_DELIMITER() {
		return ':';
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
		return 'Attribute';
	}
}

module.exports = Attribute;
