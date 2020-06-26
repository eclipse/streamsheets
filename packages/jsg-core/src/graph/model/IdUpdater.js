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
const Strings = require('../../commons/Strings');
const ItemAttributes = require('../attr/ItemAttributes');
const OrthogonalLayout = require('../../layout/OrthogonalLayout');

/**
 * This class is used to update the ID of {{#crossLink "GraphItem"}}{{/crossLink}} after it was dropped
 * or pasted. Before a drop, paste or a similar operation is done {{#crossLink
 * "IdUpdater/start:method"}}{{/crossLink}} must be called and {{#crossLink
 * "IdUpdater/end:method"}}{{/crossLink}} when the operation has finished.</br> Refer to the source
 * code of {{#crossLink "PasteItemsCommand"}}{{/crossLink}} to see an example.
 *
 * @class IdUpdater
 * @since 2.0.22.0
 */
class IdUpdater {
	constructor() {
		this.deactivate();
	}

	getNewId(oldId) {
		const newid = this.idmap[oldId.toString()];
		return newid ? Number(newid) : undefined;
	}

	updateExpressions() {
		let id;
		let newId;

		this.expressions.forEach((expression) => {
			let formula = expression.getFormula();
			if (formula !== undefined) {
				let start = 0;
				const { length } = formula;
				let pos = formula.indexOf('Item.', start);
				while (pos !== -1) {
					start = pos + 5;
					let end = start;
					while (end < length && formula[end] !== '!') {
						end += 1;
					}
					if (formula[end] === '!') {
						id = formula.substring(start, end);
						newId = this.idmap[id];
						if (newId) {
							formula = Strings.remove(formula, start, end - start);
							formula = Strings.insert(formula, start, newId);
						}
					} else {
						break;
					}
					pos = formula.indexOf('Item.', start);
				}
				expression.setFormula(formula);
			}
		});
	}

	updateAttributeLists() {
		this.attributelists.forEach((list) => {
			const ref = list._pl;
			if (ref) {
				// refs are of form '(id):...'
				const cutIndex = ref.indexOf('):');
				if (cutIndex > 0 && Strings.startsWith(ref, '(')) {
					const id = ref.substring(1, cutIndex);
					const newId = this.idmap[id];
					if (newId) {
						list._pl = `(${newId}${ref.substring(cutIndex)}`;
					}
				}
			} else {
				JSG.debug.log(
					`IdUpdater:skipped AttributeList '${list.getPath()}' because its parent reference is undefined now`,
					JSG.debug.DUMP_IDUPDATER
				);
			}
		});
	}

	updatePort(id, graph) {
		const newId = this.getNewId(id);
		return graph && graph.getPortById(newId);
	}

	clearCoordinate(coord) {
		// clears formula of given coordinate
		coord.getX().setFormula(undefined);
		coord.getY().setFormula(undefined);
	}

	disableAutoLayout(edge) {
		const settings = edge.getLayoutSettings();
		if (settings) {
			settings.set(OrthogonalLayout.BEHAVIOR, ItemAttributes.LineBehavior.MANUAL);
		}
	}

	updateEdges(graph) {
		let port;

		this.edges.forEach((item) => {
			item.disableRefresh();
			item.getShape().disableRefresh();
			if (item.sourcePortId !== undefined) {
				port = this.updatePort(item.sourcePortId, graph);
				item.setSourcePort(port);
				if (!port) {
					// corresponding port/node was not copied => delete formula from coordinate!
					this.clearCoordinate(item.getStartCoordinate());
					this.disableAutoLayout(item);
				}
			}
			if (item.targetPortId !== undefined) {
				port = this.updatePort(item.targetPortId, graph);
				item.setTargetPort(port);
				if (!port) {
					// corresponding port/node was not copied => delete formula from coordinate!
					this.clearCoordinate(item.getEndCoordinate());
					this.disableAutoLayout(item);
				}
			}
			item.enableRefresh();
			item.getShape().enableRefresh();
		});
	}

	updateIds(graph) {
		this.updateExpressions();
		this.updateAttributeLists();
		this.updateEdges(graph);
	}

	evaluate() {
		this.items.forEach((item) => {
			item.evaluate();
		});

		this.items = undefined;
	}

	deactivate() {
		this._isActive = false;
		this.idmap = undefined;
		this.edges = undefined;
		this.expressions = undefined;
		this.attributelists = undefined;
	}

	/**
	 * Gets a new id for given old one or <code>undefined</code> if no mapping exists.
	 * @method getId
	 * @param {Number} oldId The old id to get a new for.
	 * @return {Number} The new mapped id or <code>undefined</code>.
	 */
	getId(oldId) {
		return this.getNewId(oldId);
	}
	/**
	 * Adds an id mapping.
	 * @method mapId
	 * @param {Number} oldId The <code>GraphItem</code> id.
	 * @param {Number} newId The new <code>GraphItem</code> id.
	 */
	mapId(oldId, newId) {
		if (oldId !== undefined && newId !== undefined) {
			this.idmap[oldId.toString()] = newId.toString();
		} else {
			/* eslint-disable no-console */
			console.warn('IdUpdater: cannot map undefined IDs');
			/* eslint-enable no-console */
		}
	}
	/**
	 * Adds an <code>Edge</code> to this updater to check the IDs of its attached nodes.
	 * @method addEdge
	 * @param {Edge} edge The <code>Edge</code> to check.
	 */
	addEdge(edge) {
		this.edges.push(edge);
	}
	/**
	 * Adds an <code>GraphItem</code> to this updater to check the IDs of its attached nodes.
	 * @method addItem
	 * @param {GraphItem} item The <code>GraphItem</code> to check.
	 * @since 2.2.30
	 */
	addItem(item) {
		this.items.push(item);
	}
	/**
	 * Adds an <code>Expression</code> to this updater to check ID usage within its formula.
	 * @method addExpression
	 * @param {BooleanExpression} expr The <code>Expression</code> to check.
	 */
	addExpression(expr) {
		this.expressions.push(expr);
	}
	/**
	 * Adds a <code>Condition</code> to this updater to check ID usage within its referenced item.
	 * @method addCondition
	 * @param {Condition} cond The <code>Condition</code> to check.
	 * @since 2.1.0.0
	 */
	/**
	 * Adds an <code>AttributeList</code> to this updater to check its parent list reference.
	 * @method addAttributeList
	 * @param {AttributeList} list The <code>AttributeList</code> to check.
	 */
	addAttributeList(list) {
		this.attributelists.push(list);
	}
	/**
	 * Activates this updater. This must be called at the beginning of a drop, paste or similar operation.<br/>
	 * See {{#crossLink "IdUpdater/end:method"}}{{/crossLink}}.
	 * @method start
	 */
	start() {
		if (!this.isActive) {
			this.idmap = {};
			this.edges = [];
			this.items = [];
			this.expressions = [];
			this.attributelists = [];
			this.isActive = true;
		}
	}
	/**
	 * Deactivates this updater. This must be called at the end of a drop, paste or similar operation.<br/>
	 * This updates the IDs of all added <code>Edges</code>, <code>AttributeLists</code> and
	 * <code>Expressions</code>.
	 * <br/>
	 * <b>Note:</b> this method will evaluate given <code>Graph</code> after all IDs were updated. So it is not
	 * necessary to call <code>Graph.evaluate()</code> afterwards.<br/>
	 * See {{#crossLink "IdUpdater/end:method"}}{{/crossLink}}.
	 * @method end
	 * @param {Graph} graph The graph model required to access model objects by id.
	 */
	end(graph) {
		if (!this.isActive) {
			/* eslint-disable no-console */
			console.warn('IdUpdater: calling end() without previously called start() has no effect!');
			/* eslint-enable no-console */
		} else {
			this.updateIds(graph);
			this.deactivate();
			this.evaluate();
			// graph.evaluate();
			// I do not see why this is necessary
			// if (restore) {
			// 	graph._restoreConnections(graph);
			// }
		}
	}
	/**
	 * Simply deactivates this updater without updating any IDs.<br/>
	 * See {{#crossLink "IdUpdater/end:method"}}{{/crossLink}}.
	 * @method cancel
	 * @since 2.2.8
	 */
	cancel() {
		this.deactivate();
	}
	/**
	 * Returns direct access to all currently registered {{#crossLink
	 * "BooleanExpression"}}{{/crossLink}}s.<br/>
	 * <b>Note:</b> this is mainly an API internal method and should not be used outside the framework
	 * @method getExpressions
	 * @return {Array} A list of currently registered expressions.
	 * @since 2.2.8
	 */
	getExpressions() {
		return this.expressions || [];
	}

	/**
	 * Flag which signals if this updater is currently active.
	 * @property isActive
	 * @type {Boolean}
	 */

	get isActive() {
		return this._isActive;
	}

	set isActive(val) {
		this._isActive = val;
	}
}

module.exports = IdUpdater;
