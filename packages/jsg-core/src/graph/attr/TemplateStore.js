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
const AttributeList = require('./AttributeList');
const EdgeAttributes = require('./EdgeAttributes');
const ItemAttributes = require('./ItemAttributes');
const LayoutAttributes = require('./LayoutAttributes');
const FormatAttributes = require('./FormatAttributes');
const TextFormatAttributes = require('./TextFormatAttributes');
const TextNodeAttributes = require('./TextNodeAttributes');
const Strings = require('../../commons/Strings');

/**
 * A <code>TemplateStore</code> is a simple <code>AttributeList</code> subclass to manage a list of
 * {{#crossLink "Template"}}{{/crossLink}}s which can be used as parents for arbitrary
 * {{#crossLink "AttributeList"}}{{/crossLink}}s.<br/>
 * To add a <code>Template</code> call {{#crossLink "TemplateStore/addTemplate:method"}}{{/crossLink}}.
 * <b>Important:</b> adding a <code>Template</code> will be ignored if the store contains already a
 * <code>Template</code> of same name. In order to change a <code>Template</code> use {{#crossLink
 * "TemplateStore/updateTemplate:method"}}{{/crossLink}}.<br/> Finally note that an instance of this
 * store is globally accessible via {{#crossLink "JSG/TemplateStore:property"}}{{/crossLink}}.
 *
 * @class TemplateStore
 * @extends AttributeList
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined
 *     <code>Template</code>s.
 * @constructor
 */
class TemplateStore extends AttributeList {
	constructor(mapExpr) {
		super(TemplateStore.NAME, mapExpr);
		this.addDefaultTemplates();
	}

	/**
	 * Called on store creation to add default <code>Template</code>s. By default all framework <code>Template</code>s
	 * are registered.
	 *
	 * @method addDefaultTemplates
	 */
	addDefaultTemplates() {
		// add our default framework templates...
		this.addTemplate(EdgeAttributes.template);
		this.addTemplate(FormatAttributes.template);
		this.addTemplate(ItemAttributes.template);
		this.addTemplate(LayoutAttributes.template);
		this.addTemplate(TextFormatAttributes.template);
		this.addTemplate(TextNodeAttributes.template);
	}

	/**
	 * Adds given <code>Template</code> to this store.<br/>
	 * <b>Note:</b> if a <code>Template</code> of same name is already in store, adding given <code>Template</code> is
	 * ignored. To update a <code>Template</code> use {{#crossLink
	 * "TemplateStore/updateTemplate:method"}}{{/crossLink}}.
	 *
	 * @method addTemplate
	 * @param {Template} template The <code>Template</code> to add.
	 * @return {Boolean} <code>true</code> if <code>Template</code> was added, <code>false</code> otherwise.
	 */
	addTemplate(template) {
		const contained = !!this.getTemplate(template.getName());
		if (!contained) {
			this.addAttribute(template);
		}
		return !contained;
	}

	// overwritten: called during reading, so we have to ensure that we create a template...
	addAttribute(template) {
		if (!template.isTemplate) {
			template = template.toTemplate();
		}
		super.addAttribute(template);
	}

	/**
	 * Returns the template which is registered under given name.
	 *
	 * @method getTemplate
	 * @param {String} name The name of the template to get.
	 * @return {ConstAttributeList} The template or <code>undefined</code>.
	 */
	getTemplate(name) {
		return this.getAttribute(name);
	}

	/**
	 * Checks if there is already a <code>Template</code> stored which has the same name as given <code>Template</code>
	 * or String.
	 *
	 * @method hasTemplate
	 * @param {String|Template} template Either a <code>Template</code> name or a <code>Template</code>
	 *     instance.
	 * @return {Boolean} <code>true</code> if a <code>Template</code> of same name is already stored,
	 *     <code>false</code> otherwise.
	 */
	hasTemplate(template) {
		const name = Strings.isString(template) ? template : template.getName();
		return !!this.getTemplate(name);
	}

	/**
	 * Updates specified <code>Template</code> with the attributes from given list or array.<br/>
	 * Note: attributes which are not in <code>Template</code> will be added.
	 *
	 * @method updateTemplate
	 * @param {String} name The name of the <code>Template</code> to update.
	 * @param {Array | AttributeList} list A list or array of attributes which define the new
	 *     <code>Template</code> settings.
	 * @return {Boolean} <code>true</code> if specified <code>Template</code> was changed, <code>false</code>
	 *     otherwise.
	 */
	updateTemplate(name, list) {
		const oldTemplate = Strings.isString(name)
			? this.getTemplate(name)
			: undefined;
		return oldTemplate ? oldTemplate.update(list) : false;
	}

	/**
	 * Removes given <code>Template</code> from this store.<br/>
	 * <b>Note:</b> use with care!! Ensure that removed <code>Template</code> is not referenced by an {{#crossLink
	 * "AttributeList"}}{{/crossLink}}.
	 *
	 * @method removeTemplate
	 * @param {ConstAttributeList} template The <code>Template</code> to remove.
	 */
	removeTemplate(template) {
		if (Strings.isString(template)) {
			template = this.getTemplate(template);
		}
		if (template) {
			this.removeAttribute(template);
		}
	}

	// overwritten for custom read...
	// TODO implement using JSON
	// read(reader, xml) {
	// 	if (Strings.isString(xml)) {
	// 		reader = new XMLReader(xml);
	// 		xml = reader._dom;
	// 		// parser = new DOMParser();
	// 		// xml = parser.parseFromString(xml, "text/xml");
	// 	}
	// 	// TODO what to do if loaded templates want to overwrite existing ones...
	// 	const templates = xml.getElementsByTagName(TemplateStore.NAME)[0];
	// 	super.read(reader, templates);
	// 	// call evaluate to resolve unresolved parent references:
	// 	this.evaluate();
	// }
	//
	//
	// // overwritten for custom save...
	// save() {
	// 	const xml = new XMLWriter('UTF-8', '1.0');
	// 	xml.writeStartDocument();
	// 	this._save(TemplateStore.NAME, xml);
	// 	xml.writeEndDocument();
	// 	return xml.flush();
	// }

	// overwritten for custom save...
	_save(tag, xml) {
		xml.writeStartElement(tag);
		this._saveValue(xml);
		return xml.writeEndElement();
	}

	static get NAME() {
		return 'templates';
	}
}


module.exports = TemplateStore;
