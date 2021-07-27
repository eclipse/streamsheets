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
import {SketchPicker} from "react-color";

const {
	CellEditor,
} = JSG;


class CellRangeComponent extends React.Component {
	static propTypes = {
		onChange: PropTypes.func,
		onValueChange: PropTypes.func,
		onBlur: PropTypes.func,
		onFocus: PropTypes.func,
		validate: PropTypes.func,
		sheetView: PropTypes.object.isRequired,
		onlyReference: PropTypes.bool,
		inputEditorType: PropTypes.string,
		inputEditorOptions: PropTypes.array,
		// fontSize: PropTypes.string
	};

	static defaultProps = {
		onChange: () => {},
		onValueChange: () => {},
		onBlur: () => {},
		onFocus: () => {},
		validate: () => true,
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
		const node = event.currentTarget.parentNode.querySelector('#sheet-ref');
		// node.focus();
		this.setState({
			inputEditorOpen: true,
			anchorEl: node
		});
	}

	onCloseInputEditor = () => {
		this.setState({
			inputEditorOpen: false
		});
		this.state.anchorEl.focus();
	};

	onSelectColor = (color, event) => {
		this.state.anchorEl.innerHTML = color.hex;

		if (event.target && event.target.style.cursor === 'pointer') {
			this.setState({
				inputEditorOpen: false,
			});
		}
		this.state.anchorEl.focus();
		this.props.onValueChange(color.hex);
	}

	onSelectInput = (option) => {
		this.state.anchorEl.innerHTML = option.value;
		this.props.onValueChange(option.value);
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

		let cellEditor = CellEditor.getActiveCellEditor();
		if (!cellEditor) {
			cellEditor = CellEditor.activateCellEditor(event.target, graphManager.getGraphViewer(), view.getItem());
		}
		cellEditor.alwaysReplace = this.props.onlyReference;
		cellEditor.activateReferenceMode();
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
		if (event.relatedTarget && event.relatedTarget.tagName === 'A') {
			return;
		}

		if (event.relatedTarget) {
			const cancel = event.relatedTarget.id === 'RefCancel';
			event.target.innerHTML = cancel ? this.state.oldValue : event.target.textContent;
		} else if (event.type === 'keydown' && event.key === 'Enter') {
			event.target.innerHTML = event.target.textContent;
		}

		if (this.props.validate && !this.props.validate(event.target.innerHTML)) {
			event.target.innerHTML = this.state.oldValue;
		}

		if (event.type === 'keydown') {
			event.target.blur();
		} else {
			this.props.onBlur(event);
			if (event.target) {
				this.props.onValueChange(event.target.textContent);
			}
		}

		this.setState({
			focus: false,
		});

		CellEditor.deActivateCellEditor();
		graphManager.redraw();
	};

	handleMouseUp = () => {
		const cellEditor = CellEditor.getActiveCellEditor();
		if (cellEditor) {
			cellEditor.updateFunctionInfo();
		}
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

		cellEditor.updateFunctionInfo();
	};

	handleKeyDown = (event) => {
		const view = this.props.sheetView;
		if (view === undefined) {
			return;
		}

		const cellEditor = CellEditor.getActiveCellEditor();
		if (cellEditor.handleFunctionListKey(event, view)) {
			return;
		}

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
					cellEditor.updateReference(event, view,);
				}
			}
			break;
		}
		default:
			break;
		}

		if (cellEditor.isReferenceChar(event.key)) {
			cellEditor.oldContent = undefined;
		}

		switch (event.key) {
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

	getLabel(option) {
		if (option.label === undefined) {
			return option.value;
		}

		return `${option.value} - ${intl.formatMessage({id: option.label}, {})}`
	}

	getPresetColors(color) {
		const colors = [
			{title: 'Black', color: '#000000'},
			{title: 'Tundora', color: '#434343'},
			{title: 'Dove Gray', color: '#666666'},
			{title: 'Dusty Gray', color: '#999999'},
			{title: 'Nobel', color: '#b7b7b7'},
			{title: 'Silver', color: '#cccccc'},
			{title: 'Alto', color: '#d9d9d9'},
			{title: 'Gallery', color: '#efefef'},
			{title: 'Concrete', color: '#f3f3f3'},
			{title: 'White', color: '#ffffff'},
			{title: 'Dark Red', color: '#980000'},
			{title: 'Red', color: '#ff0000'},
			{title: 'Orange', color: '#ff9900'},
			{title: 'Yellow', color: '#ffff00'},
			{title: 'Green', color: '#00ff00'},
			{title: 'Light Blue', color: '#00ffff'},
			{title: 'Cornflower Blue', color: '#4a86e8'},
			{title: 'Blue', color: '#0000ff'},
			{title: 'Electric Violet', color: '#9900ff'},
			{title: 'Magenta ', color: '#ff00ff'},
			{title: '#e6b8af', color: '#e6b8af'},
			{title: '#f4cccc', color: '#f4cccc'},
			{title: '#fce5cd', color: '#fce5cd'},
			{title: '#fff2cc', color: '#fff2cc'},
			{title: '#d9ead3', color: '#d9ead3'},
			{title: '#d0e0e3', color: '#d0e0e3'},
			{title: '#c9daf8', color: '#c9daf8'},
			{title: '#cfe2f3', color: '#cfe2f3'},
			{title: '#d9d2e9', color: '#d9d2e9'},
			{title: '#ead1dc', color: '#ead1dc'},
			{title: '#dd7e6b', color: '#dd7e6b'},
			{title: '#ea9999', color: '#ea9999'},
			{title: '#f9cb9c', color: '#f9cb9c'},
			{title: '#ffe599', color: '#ffe599'},
			{title: '#b6d7a8', color: '#b6d7a8'},
			{title: '#a2c4c9', color: '#a2c4c9'},
			{title: '#a4c2f4', color: '#a4c2f4'},
			{title: '#9fc5e8', color: '#9fc5e8'},
			{title: '#b4a7d6', color: '#b4a7d6'},
			{title: '#d5a6bd', color: '#d5a6bd'},
			{title: '#cc4125', color: '#cc4125'},
			{title: '#e06666', color: '#e06666'},
			{title: '#f6b26b', color: '#f6b26b'},
			{title: '#ffd966', color: '#ffd966'},
			{title: '#93c47d', color: '#93c47d'},
			{title: '#76a5af', color: '#76a5af'},
			{title: '#6d9eeb', color: '#6d9eeb'},
			{title: '#6fa8dc', color: '#6fa8dc'},
			{title: '#8e7cc3', color: '#8e7cc3'},
			{title: '#c27ba0', color: '#c27ba0'},
			{title: '#a61c00', color: '#a61c00'},
			{title: '#cc0000', color: '#cc0000'},
			{title: '#e69138', color: '#e69138'},
			{title: '#f1c232', color: '#f1c232'},
			{title: '#6aa84f', color: '#6aa84f'},
			{title: '#45818e', color: '#45818e'},
			{title: '#3c78d8', color: '#3c78d8'},
			{title: '#3d85c6', color: '#3d85c6'},
			{title: '#674ea7', color: '#674ea7'},
			{title: '#a64d79', color: '#a64d79'},
			{title: '#85200c', color: '#85200c'},
			{title: '#990000', color: '#990000'},
			{title: '#b45f06', color: '#b45f06'},
			{title: '#bf9000', color: '#bf9000'},
			{title: '#38761d', color: '#38761d'},
			{title: '#134f5c', color: '#134f5c'},
			{title: '#1155cc', color: '#1155cc'},
			{title: '#0b5394', color: '#0b5394'},
			{title: '#351c75', color: '#351c75'},
			{title: '#741b47', color: '#741b47'},
			{title: '#5b0f00', color: '#5b0f00'},
			{title: '#660000', color: '#660000'},
			{title: '#783f04', color: '#783f04'},
			{title: '#7f6000', color: '#7f6000'},
			{title: '#274e13', color: '#274e13'},
			{title: '#0c343d', color: '#0c343d'},
			{title: '#1c4587', color: '#1c4587'},
			{title: '#073763', color: '#073763'},
			{title: '#20124d', color: '#20124d'},
			{title: '#4c1130', color: '#4c1130'}
		];

		colors.push({ title: 'None', color: 'transparent' });

		if (color) {
			colors.forEach(colorl => {
				if (colorl.color === color.toLowerCase()) {
					colorl.title += `${intl.formatMessage({id: 'Current'}, {})}`;
				}
			});
		}

		return colors;
	}

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
					onBlur={(event) => this.handleBlur(event)}
					onKeyUp={this.handleKeyUp}
					onMouseUp={this.handleMouseUp}
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
						onMouseUp={(event) => this.onInputEditor(event)}
						// disabled={this.state.inputEditorOpen}
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
					{this.props.inputEditorType === 'color' ? (
					<SketchPicker
						style={{
							boxShadow: 'none !important',
							backgroundColor: 'inherit',
							background: 'inherit'
						}}
						// classes={{ 'sketch-picker': classes.default }}
						width={250}
						disableAlpha
						presetColors={this.getPresetColors(this.props.range)}
						color={this.props.range}
						onChange={(color, event) => this.onSelectColor(color, event)}
					/>
						) : (
					<MenuList>
						{this.props.inputEditorOptions.map((option) =>
							<MenuItem
								dense
								key={option.value}
								onClick={() => this.onSelectInput(option)}
							>
								{this.getLabel(option)}
							</MenuItem>
						)}
					</MenuList>)}
				</Popover>
				] : null}
				<IconButton
					id="RefOK"
					style={{
						width: '34px',
						cursor: 'pointer important',
						pointerEvents: 'auto',
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
						cursor: 'pointer important',
						pointerEvents: 'auto',
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
