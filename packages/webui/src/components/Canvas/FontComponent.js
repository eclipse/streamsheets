/* eslint-disable react/forbid-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as Actions from '../../actions/actions';
import ColorComponent from '../SheetDialogs/ColorComponent';


class FontComponent extends React.Component {
	static propTypes = {
		font: PropTypes.object.isRequired,
		handler: PropTypes.func.isRequired,
		visible: PropTypes.bool,
	};

	static defaultProps = {
		visible: true,
	};

	handleFontNameChange = (event) => {
		this.props.handler('name', event.target.value);
	};

	handleFontSizeChange = (event) => {
		this.props.handler('size', event.target.value);
	};

	handleFontColorChange = (color) => {
		this.props.handler('color', color);
	};

	handleFontColorClose = () => {
		// this.props.handler('color', color);
	};

	handleFontBoldChange = () => (event, state) => {
		this.props.handler('bold', state);
	};

	handleFontItalicChange = (event, state) => {
		this.props.handler('italic', state);
	};

	render() {
		return (
			<div
				style={{
					display: this.props.visible ? 'inherit' : 'none',
				}}
			>
				<div>
					<FormControl
						style={{
							width: '140px',
							marginRight: '20px',
							marginTop: '15px',
						}}
					>
						<InputLabel htmlFor="font-name">
							<FormattedMessage
								id="FormatCellsDialog.fontName"
								defaultMessage="Font Name"
							/>
						</InputLabel>
						<Select
							id="font-name"
							value={this.props.font.fontName}
							onChange={this.handleFontNameChange}
							input={<Input
								name="font-name"
								id="font-name"
							/>}
						>
							<MenuItem value="Arial" key={1}>Arial</MenuItem>
							<MenuItem value="Courier New" key={2}>Courier New</MenuItem>
							<MenuItem value="Georgia" key={3}>Georgia</MenuItem>
							<MenuItem value="Lucida Console" key={4}>Lucida Console</MenuItem>
							<MenuItem value="Lucida Sans" key={5}>Lucida Sans</MenuItem>
							<MenuItem value="Palatino" key={6}>Palatino</MenuItem>
							<MenuItem value="Tahoma" key={7}>Tahoma</MenuItem>
							<MenuItem value="Trebuchet MS" key={8}>Trebuchet MS</MenuItem>
							<MenuItem value="Verdana" key={9}>Verdana</MenuItem>
						</Select>
					</FormControl>
					<FormControl
						style={{
							marginTop: '15px',
							width: '80px',
						}}
					>
						<InputLabel htmlFor="font-size">
							<FormattedMessage
								id="FormatCellsDialog.fontSize"
								defaultMessage="Font Size"
							/>
						</InputLabel>
						<Select
							id="font-size"
							value={this.props.font.fontSize}
							onChange={this.handleFontSizeChange}
							input={<Input
								name="font-size"
								id="font-size"
							/>}
						>
							<MenuItem value="6" key={0}>6</MenuItem>
							<MenuItem value="7" key={0}>7</MenuItem>
							<MenuItem value="8" key={0}>8</MenuItem>
							<MenuItem value="9" key={1}>9</MenuItem>
							<MenuItem value="10" key={2}>10</MenuItem>
							<MenuItem value="12" key={3}>12</MenuItem>
							<MenuItem value="14" key={4}>14</MenuItem>
							<MenuItem value="18" key={5}>18</MenuItem>
							<MenuItem value="24" key={6}>24</MenuItem>
							<MenuItem value="30" key={7}>30</MenuItem>
							<MenuItem value="36" key={8}>36</MenuItem>
						</Select>
					</FormControl>
				</div>
				<div
					style={{
						marginTop: '13px',
						display: 'flex',
					}}
				>
					<FormControlLabel
						style={{
							marginTop: '10px',
						}}
						control={
							<Checkbox
								checked={this.props.font.bold}
								indeterminate={this.props.font.bold === ''}
								onChange={this.handleFontBoldChange()}
							/>
						}
						label={<FormattedMessage
							id="FormatCellsDialog.fontBold"
							defaultMessage="Bold"
						/>}
					/>
					<FormControlLabel
						style={{
							marginTop: '10px',
							marginRight: '12px',
						}}
						control={
							<Checkbox
								checked={this.props.font.italic}
								indeterminate={this.props.font.italic === ''}
								onChange={this.handleFontItalicChange}
							/>
						}
						label={<FormattedMessage
							id="FormatCellsDialog.fontItalic"
							defaultMessage="Italic"
						/>}
					/>
					<FormControl>
						<ColorComponent
							label={<FormattedMessage
								id="FormatCellsDialog.fontColor"
								defaultMessage="Font Color"
							/>}
							width={75}
							color={this.props.font.color}
							onChange={this.handleFontColorChange}
							onClose={this.handleFontColorClose}
						/>
					</FormControl>
				</div>
			</div>
		);
	}
}

function mapStateToProps() {
	return {
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators(Actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FontComponent);
