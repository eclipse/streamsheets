/* eslint-disable react/prop-types */
import React, { Component } from 'react';
import { FuncTerm, Term } from '@cedalo/parser';
import JSG from '@cedalo/jsg-ui';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { graphManager } from '../../GraphManager';
import * as Actions from '../../actions/actions';

const {
	ItemAttributes,
	AttributeUtils,
	StreamSheet,
	StreamSheetView,
	StreamSheetContainerView,
	WorksheetNode,
	RemoveSelectionCommand,
	DeleteCellContentCommand,
	SetAttributeAtPathCommand,
	SetCellDataCommand,
	SetChartFormulaCommand,
	CellEditor,
	Expression,
	Strings,
	SelectionProvider,
	SheetPlotView,
} = JSG;

/**
 * @class EditBarComponent
 */
export class EditBarComponent extends Component {
	componentDidMount() {
		JSG.NotificationCenter.getInstance().register(
			this,
			WorksheetNode.SELECTION_CHANGED_NOTIFICATION,
			'onSheetSelectionChanged',
		);
		JSG.NotificationCenter.getInstance().register(
			this,
			SelectionProvider.SELECTION_CHANGED_NOTIFICATION,
			'onGraphSelectionChanged',
		);
	}

	componentWillUnmount() {
		JSG.NotificationCenter.getInstance().unregister(
			this,
			WorksheetNode.SELECTION_CHANGED_NOTIFICATION
		);
		JSG.NotificationCenter.getInstance().unregister(
			this,
			SelectionProvider.SELECTION_CHANGED_NOTIFICATION
		);
	}

	onGraphSelectionChanged() {
		const getContainer = (item) => {
			if (item instanceof StreamSheet) {
				return undefined;
			}

			let ws = item.getParent();
			while (ws && !(ws instanceof StreamSheet)) {
				ws = ws.getParent();
			}

			return ws;
		};

		const getProcessContainerView = (controller) => {
			let view = controller.getView();
			while (view && !(view instanceof StreamSheetContainerView)) {
				view = view.getParent();
			}

			return view;
		};

		this.removeSheetSelection();

		const formula = document.getElementById('editbarformula');
		const info = document.getElementById('editbarreference');
		const selection = graphManager.getGraphViewer().getSelection();
		let formulaText = '';
		const jsgState = {};
		const appState = {};

		if (selection.length) {
			graphManager.getGraphViewer().getGraphView().setFocus(selection[0]);
		}

		if (selection !== undefined && selection.length === 1) {
			const item = selection[0].getModel();
			const sheet = getContainer(item);
			if (sheet) {
				formulaText = selection[0].getView().getSelectedFormula(sheet);
				if (formulaText) {
					jsgState.graphCellSelected = true;
				}
				const attr = item.getAttributeAtPath('showwizard');
				if ((item instanceof JSG.ChartNode) && item.getDataRange() && attr && attr.getValue() === true) {
					graphManager.getGraphEditor().invalidate();
					appState.showChartProperties = true;
					attr.setExpressionOrValue(false);
				}
				if ((item instanceof JSG.SheetPlotNode) && attr && attr.getValue() === true) {
					item.createSeriesFromSelection(
						graphManager.getGraphViewer(),
						sheet,
						graphManager.chartSelection,
						graphManager.chartType
					);
					graphManager.getGraphEditor().invalidate();
					attr.setExpressionOrValue(false);
				}
			}

			const view = getProcessContainerView(selection[0]);
			if (view !== undefined) {
				view.moveSheetToTop(graphManager.getGraphViewer());
			}
		} else {
			appState.showChartProperties = false;
			jsgState.graphCellSelected = false;
		}

		formula.innerHTML = Strings.encodeXML(formulaText);
		info.innerHTML = '';

		if (this.props.cellSelected === true) {
			jsgState.cellSelected = false;
		}

		if (Object.keys(jsgState).length) {
			this.props.setJsgState(jsgState);
		}
		if (Object.keys(appState).length) {
			this.props.setJsgState(appState);
		}
		
	}

	onSheetSelectionChanged(notification) {
		const { item } = notification.object;
		const formula = document.getElementById('editbarformula');
		const info = document.getElementById('editbarreference');

		if (CellEditor.getActiveCellEditor()) {
			return;
		}

		if (graphManager.getGraphViewer().getSelection().length) {
			this.onGraphSelectionChanged();
			return;
		}

		const view = graphManager.getActiveSheetView();

		if (!item || !view || view.getItem() !== item) {
			return;
		}

		const activeCell = item.getOwnSelection().getActiveCell();

		if (!(item instanceof StreamSheet) || activeCell === undefined) {
			if (this.props.cellSelected) {
				this.props.setJsgState({ cellSelected: false });
			}
			formula.innerHTML = '';
			info.innerHTML = '';
			return;
		}

		this.removeSheetSelection(item);

		const value = view ? view.getEditString(activeCell) : '';

		formula.innerHTML = value;
		info.innerHTML = item.getOwnSelection().refToString();

		if (this.props.cellSelected === false) {
			this.props.setJsgState({ cellSelected: true });
		}
	}

	getSheetView() {
		let view;

		if (this.props.cellSelected) {
			view = graphManager.getActiveSheetView();
		} else if (this.props.graphCellSelected) {
			const selection = graphManager.getGraphViewer().getSelection();
			if (selection !== undefined && selection.length === 1) {
				view = selection[0].getView();
				while (view && !(view instanceof StreamSheetView)) {
					view = view.getParent();
				}
			}
		}

		return view;
	}

	removeSheetSelection(active) {
		// remove selections in other process sheets
		const processContainer = graphManager.getGraph().getStreamSheetsContainer();

		processContainer.enumerateStreamSheetContainers((container) => {
			const sheet = container.getStreamSheet();
			if (active === undefined || sheet.getId() !== active.getId()) {
				if (sheet.getOwnSelection().hasSelection()) {
					const cmd = new RemoveSelectionCommand(sheet, sheet.getSelectionId());
					cmd._noDraw = true;
					graphManager.synchronizedExecute(cmd);
				}
			}
		});
	}

	handleReferenceKeyDown = () => {};

	handleFunctionMouseDown = () => {
		this.props.setAppState({
			formulaOpen: false,
			showPasteFunctionsDialog: true,
		});
	};

	handleFormulaFocus = () => {
		const view = this.getSheetView();
		if (view === undefined) {
			return;
		}

		if (!CellEditor.getActiveCellEditor()) {
			this._cellEditor = CellEditor.activateCellEditor(document.getElementById('editbarformula'),
				graphManager.getGraphViewer(), view.getItem());
		}
		this._cellEditor.updateEditRangesView();
		this._cellEditor.editBar = true;
		this._cellEditor.focusOffset = window.getSelection().focusOffset;
	};

	handleFormulaBlur = (ev) => {
		if (!this._cellEditor.div ||
			this._cellEditor.div._ignoreBlur ||
			(ev.relatedTarget && ev.relatedTarget.tagName === 'A')) {
			return;
		}

		this.finishEditing(this._cellEditor.div.textContent);
	};

	handleFormulaKeyUp = (event) => {
		if (event.keyCode === 18 || event.altKey) {
			event.preventDefault();
			return false;
		}

		switch (event.key) {
			case 'F2':
			case 'F4':
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'ArrowRight':
			case 'ArrowDown':
			case 'Shift':
			case 'Control':
				break;
			default:
				this._cellEditor.updateEditRangesView();
				break;
		}

		this._cellEditor.updateFunctionInfo();

		return undefined;
	};

	handleFormulaMouseDown = () => {
		if (this._cellEditor) {
			this._cellEditor.deActivateReferenceMode();
		}
	};

	handleFormulaMouseUp = () => {
		if (this._cellEditor) {
			this._cellEditor.updateFunctionInfo();
		}
	};

	handleFormulaDoubleClick = () => {
		if (this._cellEditor) {
			this._cellEditor.handleDoubleClick();
			this._cellEditor.deActivateReferenceMode();
		}
	};

	handleFormulaSelect = () => {
		const selection = window.getSelection();
		if (selection.isCollapsed) {
			this._cellEditor.focusOffset = selection.focusOffset;
			this._cellEditor.focusNode = selection.focusNode;
		}
	};

	handleFormulaKeyDown = (event) => {
		const view = this.getSheetView();
		if (view === undefined) {
			return;
		}

		const formula = document.getElementById('editbarformula');

		if (this._cellEditor.handleFunctionListKey(event, view)) {
			return;
		}

		switch (event.key) {
			case 'F2':
				this._cellEditor.toggleReferenceMode();
				break;
			case 'F4':
				this._cellEditor.toggleReferenceType(event, view);
				break;
			case 'ArrowLeft':
			case 'ArrowUp':
			case 'ArrowRight':
			case 'ArrowDown':
				if (this._cellEditor.isReferenceByKeyAllowed()) {
					const index = this._cellEditor.getSelectedRangeIndex();
					this._cellEditor.activateReferenceMode();
					if (index !== undefined) {
						this._cellEditor.setActiveRangeIndex(index);
					}
					this._cellEditor.updateReference(
						event,
						view,
					);
				}
				break;
			default:
				break;
		}

		if (this._cellEditor.isReferenceChar(event.key)) {
			this._cellEditor.oldContent = undefined;
		}

		switch (event.key) {
			case 'Tab':
				event.preventDefault();
				break;
			case 'Space':
				if (event.altKey) {
					event.preventDefault();
					event.stopPropagation();
				}
				break;
			case 'Escape': {
				// ESC
				formula._ignoreBlur = true;
				window.getSelection().collapseToEnd();
				graphManager.getCanvas().focus();
				graphManager.getGraph().markDirty();
				CellEditor.deActivateCellEditor();
				view.notify();
				graphManager.redraw();
				formula._ignoreBlur = false;
				break;
			}
			case 'Enter':
				if (event.altKey) {
					// TODO
				} else {
					formula._ignoreBlur = true;
					this.finishEditing(event.target.textContent);
					event.preventDefault();
					event.stopPropagation();
					formula._ignoreBlur = false;
				}
				break;
			default:
				break;
		}
	};

	finishEditing(text) {
		const view = this.getSheetView();
		if (view === undefined) {
			return;
		}

		const graphEditor = graphManager.getGraphEditor();
		const canvas = graphManager.getCanvas();
		const selection = graphManager.getGraphViewer().getSelectionProvider();
		let data;
		const item = view.getItem();

		if (selection.hasSelection() && !selection.hasSingleSelection()) {
			return
		}

		try {
			data = item.textToExpression(text);
			// TODO: validate its a graph formula, if expected
		} catch (e) {
			const element = document.getElementById('editbarformula');
			if (this._cellEditor) {
				this._cellEditor.deActivateReferenceMode();
			}
			view.notifyMessage(
				{
					message: e.message,
					focusElement: element,
					focusIndex: e.index !== undefined ? e.index + 1 : 1
				});
			return;
		}

		let cmd;
		if (selection.hasSelection()) {
			const graphItem = selection.getFirstSelection().getModel();
			const expr = data.expression;
			let formula = expr.getFormula();
			expr.evaluate(item);
			const term = expr.getTerm();

			if (term && term instanceof FuncTerm) {
				// encode html for label
				if ((graphItem instanceof JSG.TextNode) && term.params.length > 13) {
					const param = term.params[13];
					if (param.isStatic && param.operand._value) {
						term.params[13] = Term.fromString(
							Strings.encodeXML(param.operand._value),
						);
						formula = term
							? term.toLocaleString('en', {
								item,
								useName: true,
							})
							: '';
					}
				}
			}
			const chartView = selection.getFirstSelection().getView();
			if ((chartView instanceof SheetPlotView) && chartView.hasSelectedFormula()) {
				cmd = new SetChartFormulaCommand(graphItem, chartView.chartSelection, data.expression);
			} else {
				const path = AttributeUtils.createPath(ItemAttributes.NAME, "sheetformula");
				cmd = new SetAttributeAtPathCommand(graphItem, path, new Expression(0, formula));
				// this is necessary, to keep changes, otherwise formula will be recreated from graphitem
				graphItem.setAttributeAtPath(path, formula);
				graphItem._noFormulaUpdate = true;
			}
		} else {
			const ref = item.getOwnSelection().activeCellToString();
			if (data.numberFormat) {
				const cmdFormat = view.getNumberFormatCommand(graphManager.getGraphViewer(),
					view.getOwnSelection().getActiveCell(), data.numberFormat, data.localCulture);
				if (cmdFormat) {
					graphManager.synchronizedExecute(cmdFormat);
				}
			}
			// DL-2281:
			const activeCell = item.getOwnSelection().getActiveCell();
			cmd = (activeCell.x === 1 && data.expression.getValue() === '')
				? new DeleteCellContentCommand(item, item.getOwnSelection().toStringMulti(), "all")
				: new SetCellDataCommand(item, ref, data.expression, true);
		}

		canvas.focus();

		CellEditor.deActivateCellEditor();

		if (cmd !== undefined) {
			graphManager.synchronizedExecute(cmd);
		}

		graphEditor.invalidate();
		window.getSelection().removeAllRanges();
		view.notify();
	}

	render() {
		return (
			<div
				tabIndex="-1"
				style={{
					position: 'relative',
					margin: 0,
					fontSize: '9pt',
					height: '21px'
				}}
			>
				<span
					id="editbarreference"
					disabled
					onKeyDown={this.handleReferenceKeyDown}
					contentEditable={this.props.cellSelected}
					style={{
						margin: 0,
						padding: '3px 3px 0px 3px',
						display: 'inline-block',
						color: 'black',
						position: 'relative',
						backgroundColor: 'white',
						zIndex: 101,
						width: '152px',
						wordWrap: 'break-word',
						borderBottom: '1px solid #AAAAAA',
						minHeight: '17px',
						verticalAlign: 'top',
					}}
				/>
				<span
					id="editbarcommands"
					disabled
					tabIndex="-1"
					onMouseDown={this.handleFunctionMouseDown}
					style={{
						margin: 0,
						padding: '3px 3px 0px 3px',
						display: 'inline-block',
						color: 'black',
						position: 'relative',
						backgroundColor: 'white',
						width: '102px',
						borderLeft: '1px solid #AAAAAA',
						borderBottom: '1px solid #AAAAAA',
						minHeight: '17px',
						verticalAlign: 'top',
						cursor: 'default'
					}}
				>
					F(x)
				</span>
				<span
					id="editbarformula"
					contentEditable={this.props.cellSelected || this.props.graphCellSelected}
					onKeyDown={this.handleFormulaKeyDown}
					onKeyUp={this.handleFormulaKeyUp}
					onBlur={this.handleFormulaBlur}
					onFocus={this.handleFormulaFocus}
					onMouseDown={this.handleFormulaMouseDown}
					onMouseUp={this.handleFormulaMouseUp}
					onDoubleClick={this.handleFormulaDoubleClick}
					onSelect={this.handleFormulaSelect}
					spellCheck={false}
					style={{
						margin: 0,
						padding: '3px 3px 0px 3px',
						display: 'inline-block',
						color: 'black',
						position: 'relative',
						backgroundColor: 'white',
						right: '0px',
						width: 'calc(100% - 274px)',
						wordWrap: 'break-word',
						whiteSpace: 'pre-wrap',
						borderLeft: '1px solid #AAAAAA',
						borderBottom: '1px solid #AAAAAA',
						minHeight: '17px',
						verticalAlign: 'top',
					}}
				/>
			</div>
		);
	}
}

function mapStateToProps(state) {
	return {
		cellSelected: state.jsgState.cellSelected,
		graphCellSelected: state.jsgState.graphCellSelected
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({ ...Actions }, dispatch);
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(EditBarComponent);
