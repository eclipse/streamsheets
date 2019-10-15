import { Node } from '@cedalo/jsg-core';
import CreateItemInteraction from './CreateItemInteraction';

/**
 * An interaction to create a general {{#crossLink "Node"}}{{/crossLink}} with the specified
 * {{#crossLink "Shape"}}{{/crossLink}}.
 *
 * @class CreateNodeInteraction
 * @extends CreateItemInteraction
 * @param {Shape} shape The node shape to use.
 * @param {String} [label] An optional default label for the new node.
 * @constructor
 */
class CreateNodeInteraction extends CreateItemInteraction {
	constructor(shape, label) {
		// replace first argument:
		const node = new Node(shape);
		super(node, label);
	}
}

export default CreateNodeInteraction;
