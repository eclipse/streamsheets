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
/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import JSG from '@cedalo/jsg-ui';
import { IconButton } from '@material-ui/core';
import OkIcon from '@material-ui/icons/Check';
import CancelIcon from '@material-ui/icons/Close';

import { graphManager } from '../../GraphManager';
import {withStyles} from '@material-ui/core/styles';
import styles from '../base/listing/styles';

const {
	CellEditor,
} = JSG;


class CellRangeComponent extends React.Component {
	static propTypes = {
		onChange: PropTypes.func,
		onBlur: PropTypes.func,
		onFocus: PropTypes.func,
		required: PropTypes.bool,
		label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
		helperText: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
		range: PropTypes.string.isRequired,
		sheetView: PropTypes.object.isRequired,
		onlyReference: PropTypes.bool,
		fontSize: PropTypes.string
	};

	static defaultProps = {
		onChange: () => {},
		onBlur: () => {},
		onFocus: () => {},
		onlyReference: true,
		required: false,
		fontSize: '1rem',
		helperText: undefined,
	};

	constructor(props) {
		super(props);
		this.state = {
			focus: false,
			oldValue: '',
		}
	}

	onOK = (event) => {
		this.handleBlur(event);
	};

	onCancel = (event) => {
		event.target.innerHTML = this.state.oldValue;
		event.target.blur();
		this.setState({
			focus: false,
		});
		CellEditor.deActivateCellEditor();
	};

	handleChange = (event) => {
		this.props.onChange(event);
	};

	handleFocus = (event) => {
		const view = this.props.sheetView;
		if (view === undefined) {
			return;
		}

		const cellEditor = CellEditor.activateCellEditor(event.target, graphManager.getGraphViewer(), view.getItem());
		cellEditor.alwaysReplace = this.props.onlyReference;
		cellEditor.updateEditRangesView(this.props.sheetView);
		this.setState({
			focus: true,
			oldValue: event.target.textContent,
		});
		this.props.onFocus(event);
	};

	handleDoubleClick = () => {
		const view = this.props.sheetView;
		if (view === undefined) {
			return;
		}

		const cellEditor = CellEditor.getActiveCellEditor();
		cellEditor.handleDoubleClick();
		cellEditor.deActivateReferenceMode();
	};

	handleSelect = () => {
		const selection = window.getSelection();
		const view = this.props.sheetView;
		if (view && selection && selection.isCollapsed) {
			const cellEditor = CellEditor.getActiveCellEditor();
			cellEditor.focusOffset = selection.focusOffset;
		}
	};

	handleBlur = (event) => {
		const cancel = event.relatedTarget && event.relatedTarget.id === 'RefCancel';
		if (!cancel) {
			this.props.onBlur(event);
		}
		event.target.blur();
		event.target.innerHTML = cancel ? this.state.oldValue : event.target.textContent;
		this.setState({
			focus: false,
		});

		CellEditor.deActivateCellEditor();
		graphManager.redraw();
	};

	handleKeyUp = (event) => {
		const view = this.props.sheetView;
		const cellEditor = CellEditor.getActiveCellEditor();

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
		case 'Escape':
			this.onCancel(event);
			break;
		default:
			cellEditor.updateEditRangesView(view);
			break;
		}
	};

	handleKeyDown = (event) => {
		const view = this.props.sheetView;
		if (view === undefined) {
			return;
		}

		const cellEditor = CellEditor.getActiveCellEditor();

		switch (event.key) {
		case 'F2':
			cellEditor.toggleReferenceMode();
			break;
		case 'F4':
			break;
		case 'ArrowLeft':
		case 'ArrowUp':
		case 'ArrowRight':
		case 'ArrowDown': {
			const formula = event.target;
			if (cellEditor.isReferenceByKeyAllowed(formula, view)) {
				const index = cellEditor.getSelectedRangeIndex(formula, view);
				cellEditor.activateReferenceMode();
				if (index !== undefined) {
					cellEditor.setActiveRangeIndex(index);
				}
				cellEditor.updateReference(
					event,
					view,
				);
			}
			break;
		}
		case 'Shift':
		case 'Control':
			break;
		case 'Escape':
			break;
		case 'Enter':
			event.preventDefault();
			event.stopPropagation();
			this.handleBlur(event);
			break;
		default:
			break;
		}
	};

	render() {
		const { theme } = this.props;
		return (
			<div>
				<label htmlFor="sheet-ref"
					style={{
						color: theme.cellrange.colorlight,
						fontSize: '9pt',
						transform: 'translate(0, 1.5px) scale(0.75)',
					}}>
					{(this.props.label instanceof Object) ? this.props.label :
						(this.props.label + (this.props.required ? '*' : ''))}
				</label>
				<div
					style={{
						display: 'block',
						width: '100%',
					}}
				>
					<div
						style={{
							padding: '6px 0 7px',
							fontSize: this.props.fontSize,
							borderBottom: `1px solid ${theme.cellrange.underline}`,
							// rgba(0, 0, 0, 0.42)',
							outline: 'none',
							display: 'inline-block',
							width: 'calc(100% - 50px)',
							color: theme.cellrange.color,
						}}
						id="sheet-ref"
						contentEditable
						spellCheck={false}
						suppressContentEditableWarning
						onChange={this.handleChange}
						onFocus={this.handleFocus}
						onBlur={this.handleBlur}
						onKeyUp={this.handleKeyUp}
						onKeyDown={this.handleKeyDown}
						onDoubleClick={this.handleDoubleClick}
						onSelect={this.handleSelect}
					>
						{this.props.range ? this.props.range : ''}
					</div>
					<IconButton
						id="RefOK"
						style={{
							width: '25px',
							height: '34px',
							padding: '5px',
							display: 'inline',
						}}
						onClick={(e) => this.onOK(e)}
						disabled={!this.state.focus}
					>
						<OkIcon fontSize="inherit" />
					</IconButton>
					<IconButton
						id="RefCancel"
						style={{
							width: '25px',
							height: '34px',
							padding: '5px',
							display: 'inline',
						}}
						onClick={(e) => this.onCancel(e)}
						disabled={!this.state.focus}
					>
						<CancelIcon fontSize="inherit" />
					</IconButton>
				</div>
				{this.props.helperText ?
					<label htmlFor="sheet-ref"
						   style={{
							   color: theme.cellrange.colorlight,
							   fontSize: '9pt',
							   lineHeight: '1.6rem',
							   transform: 'translate(0, 1.5px) scale(0.75)',
						   }}>
						{this.props.helperText}
					</label> : null}
			</div>
		);
	}
}

export default withStyles(styles, {withTheme: true})(CellRangeComponent);
