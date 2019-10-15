const Properties = require('./Properties');

class ImmutableProperties extends Properties {
	static of(props) {
		// handles = 
		const attributes = Object.freeze(Object.create(props.attributes));
		const formats = {
			text: Object.freeze(Object.create(props.formats.text)),
			styles: Object.freeze(Object.create(props.formats.styles))
		};
		return new ImmutableProperties(attributes, formats);
	}
}

module.exports = ImmutableProperties;
