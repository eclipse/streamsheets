
/**
 * A class which describes a layer to define visibility or selection status of
 * {{#crossLink "GraphItem"}}{{/crossLink}}s.
 *
 * @class Layer
 * @constructor
 * @param {String} name Name of the layer.
 */
class Layer {
	constructor(name) {
		/**
		 * Name of the layer.
		 * @attribute name
		 * @type {String}
		 */
		this.name = name;
		/**
		 * Defines whether items in the layer are visible.
		 * @attribute visible
		 * @type {Boolean}
		 * @optional
		 * @default true
		 */
		this.visible = true;
		/**
		 * Defines whether items in the layer are selectable.
		 * @attribute selectable
		 * @type {Boolean}
		 * @optional
		 * @default true
		 */
		this.selectable = true;
		/**
		 * Defines whether items in the layer are drawn with transparency. Valid are numbers between 0 and 100.
		 * @attribute transparency
		 * @type {Number}
		 * @optional
		 * @default 100
		 */
		this.transparency = 100;
	}

	/**
	 * Saves this Layer instance.
	 *
	 * @method save
	 * @param {Writer} writer Writer to use for streaming.
	 */
	save(writer) {
		writer.writeStartElement('layer');
		writer.writeAttributeString('name', this.name);
		writer.writeAttributeString('visible', this.visible);
		writer.writeAttributeString('selectable', this.selectable);
		writer.writeAttributeNumber('transparency', this.transparency, 0);
		writer.writeEndElement();
	}

	/**
	 * Reads from given DOM node to initialize this Layer.
	 *
	 * @method read
	 * @param {Reader} reader Reader to use for reading.
	 * @param {Object} object Object to read.
	 */
	read(reader, object) {
		this.visible = reader.getAttribute(object, 'visible') === 'true';
		this.selectable = reader.getAttribute(object, 'selectable') === 'true';
		const attr = reader.getAttribute(object, 'transparency');
		if (attr) {
			this.transparency = Number(attr);
		}
	}
}

module.exports = Layer;
