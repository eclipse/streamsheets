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
module.exports = class TreeNode {
	constructor(id, key, value, depth, expanded, color, fontcolor, checked) {
		this.id = id;
		this.key = key;
		this.value = value;
		this.depth = depth;
		this.expanded = expanded;
		this.color = color;
		this.fontcolor = fontcolor;
		this.checked = checked;

		this.visible = true;
		this.editable = true;
	}

	copy() {
		const copy = new TreeNode(
			this.id,
			this.key,
			this.value,
			this.depth,
			this.expanded,
			this.color,
			this.fontcolor,
			this.checked
		);

		copy.visible = this.visible;
		copy.level = this.level;
		copy.drawlevel = this.drawlevel;
		copy.parent = this.parent;
		copy.type = this.type;
		copy.editable = this.editable;

		return copy;
	}
};
