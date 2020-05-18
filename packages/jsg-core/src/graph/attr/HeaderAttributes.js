const AttributeList = require('./AttributeList');
const NumberAttribute = require('./NumberAttribute');
const StringAttribute = require('./StringAttribute');


// PREDEFINED ATTRIBUTES:
const DEFAULTSECTIONSIZE = 'defaultsectionsize';
const OUTLINEDIRECTION = 'outlinedirection';

// UNIQUE NAME:
const NAME = 'WorksheetHeader';
const TemplateID = 'HeaderAttributes.Template';

/**
 * @class HeaderAttributes
 * @extends AttributeList
 * @constructor
 * @param {MapExpression} [mapExpr] An optional MapExpression which contains predefined attributes.
 */
const HeaderAttributes = class HeaderAttributes extends AttributeList {
	constructor(mapExpr) {
		super(HeaderAttributes.NAME, mapExpr);

		this.setParent(HeaderAttributes.template);
	}

	newInstance(mapExpr) {
		return new HeaderAttributes(mapExpr);
	}

	getClassString() {
		return 'HeaderAttributes';
	}

	static createTemplate() {
		const ATTR = HeaderAttributes;
		const attributes = new HeaderAttributes();

		const addAttribute = (attribute, value, constraint) => {
			if (constraint) {
				attribute.getExpression().setConstraint(constraint);
			}
			value =
				value === undefined && constraint ? constraint.defValue : value;
			attribute.setExpressionOrValue(value);
			attributes.addAttribute(attribute);
		};

		// simply add default attributes:
		addAttribute(new NumberAttribute(ATTR.DEFAULTSECTIONSIZE), 2000);
		addAttribute(new StringAttribute(ATTR.OUTLINEDIRECTION), 'above');

		return attributes.toTemplate(HeaderAttributes.TemplateID);
	}

	getDefaultSectionSize() {
		return this.getAttribute(HeaderAttributes.DEFAULTSECTIONSIZE);
	}

	setDefaultSectionSize(size) {
		this.setAttribute(HeaderAttributes.DEFAULTSECTIONSIZE, size);
	}

	getOutlineDirection() {
		return this.getAttribute(HeaderAttributes.OUTLINEDIRECTION);
	}

	setOutlineDirection(direction) {
		this.setAttribute(HeaderAttributes.OUTLINEDIRECTION, direction);
	}

	doSaveParentRef() {
		return (
			this._parent &&
			this._parent.getName() !== HeaderAttributes.TemplateID
		);
	}

	static get NAME() {
		return NAME;
	}

	static get DEFAULTSECTIONSIZE() {
		return DEFAULTSECTIONSIZE;
	}

	static get OUTLINEDIRECTION() {
		return OUTLINEDIRECTION;
	}

	static get TemplateID() {
		return TemplateID;
	}
};

HeaderAttributes.template = HeaderAttributes.createTemplate();

module.exports = HeaderAttributes;
