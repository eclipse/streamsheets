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
import {IconButton, MenuItem, MenuList} from '@material-ui/core';
import OkIcon from '@material-ui/icons/Check';
import CancelIcon from '@material-ui/icons/Close';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';

import { graphManager } from '../../GraphManager';
import {withStyles} from '@material-ui/core/styles';
import styles from '../base/listing/styles';
import Popover from "@material-ui/core/Popover";
import {intl} from "../../helper/IntlGlobalProvider";

const {
	CellEditor,
} = JSG;


class CellRangeComponent extends React.Component {
	static propTypes = {
		onChange: PropTypes.func,
		onBlur: PropTypes.func,
		onFocus: PropTypes.func,
		sheetView: PropTypes.object.isRequired,
		onlyReference: PropTypes.bool,
		inputEditorType: PropTypes.string,
		inputEditorOptions: PropTypes.array,
		// fontSize: PropTypes.string
	};

	static defaultProps = {
		onChange: () => {},
		onBlur: () => {},
		onFocus: () => {},
		onlyReference: true,
		inputEditorType: 'none',
		inputEditorOptions: [],
	};

	constructor(props) {
		super(props);
		this.state = {
			focus: false,
			oldValue: '',
			inputEditorOpen: false,
		}
	}

	onOK = (event) => {
		this.handleBlur(event);
	};

	onInputEditor(event) {
		this.setState({
			inputEditorOpen: true,
			anchorEl: event.currentTarget
		});
	}

	onCloseInputEditor = () => {
		this.setState({
			inputEditorOpen: false
		});
	};

	onSelectInput = (option) => {
		this.state.anchorEl.innerHTML = option.value;
		this.setState({
			inputEditorOpen: false,
		});
		this.state.anchorEl.focus();
	}

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
		const cellEditor = CellEditor.getActiveCellEditor();
		if (cellEditor) {
			cellEditor.handleDoubleClick();
			cellEditor.deActivateReferenceMode();
		}
	};

	handleSelect = () => {
		const selection = window.getSelection();
		const view = this.props.sheetView;
		if (view && selection && selection.isCollapsed) {
			const cellEditor = CellEditor.getActiveCellEditor();
			if (cellEditor) {
				cellEditor.focusOffset = selection.focusOffset;
			}
		}
	};

	handleBlur = (event) => {
		if (event.relatedTarget && event.relatedTarget.id === 'RefInput') {
			this.onInputEditor(event);
			return;
		}
		const cancel = event.relatedTarget && event.relatedTarget.id === 'RefCancel';
		event.target.innerHTML = cancel ? this.state.oldValue : event.target.textContent;
		if (event.type === 'keydown') {
			event.target.blur();
		} else {
			this.props.onBlur(event);
		}
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
			<div
				style={{
					display: 'block',
					width: '100%',
				}}
			>
				<div
					style={{
						padding: '10.5px 0px 10.5px 14px',
						outline: 'none',
						display: 'inline-block',
						width: `calc(100% - ${this.props.inputEditorType === 'none' ? '82px' : '116px'})`,
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
				{this.props.inputEditorType !== 'none' ? [
					<IconButton
						id="RefInput"
						style={{
							width: '34px',
							height: '34px',
							padding: '5px',
							display: 'inline',
						}}
						onClick={this.onInputEditor}
						disabled={!this.state.focus}
					>
						<ArrowDropDownIcon fontSize="inherit" />
					</IconButton>
				,
				<Popover
					open={this.state.inputEditorOpen}
					anchorEl={this.state.anchorEl}
					anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
					transformOrigin={{ horizontal: 'left', vertical: 'top' }}
					onClose={this.onCloseInputEditor}
				>
					<MenuList>
						{this.props.inputEditorOptions.map((option) =>
							<MenuItem
								dense
								key={option.value}
								onClick={() => this.onSelectInput(option)}
							>
								{`${option.value} - ${intl.formatMessage({ id: option.label }, {})}`}
							</MenuItem>
						)}
					</MenuList>
				</Popover>
				] : null}
				<IconButton
					id="RefOK"
					style={{
						width: '34px',
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
						width: '34px',
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
		);
	}
}

export default withStyles(styles, {withTheme: true})(CellRangeComponent);
