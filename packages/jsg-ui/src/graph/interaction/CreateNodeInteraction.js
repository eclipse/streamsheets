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
