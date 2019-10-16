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
