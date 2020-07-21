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
/* eslint-disable react/forbid-prop-types, jsx-a11y/click-events-have-key-events , react/no-unused-prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import CardHeader from '@material-ui/core/CardHeader/CardHeader';
import LinearProgress from '@material-ui/core/LinearProgress/LinearProgress';
import ResourceHeaderButton from './ResourceHeaderButton';
import ResourceMenu from './ResourceMenu';
import { shorten, jsonPath } from './Utils';

const getState = (state, resource) => {
	if (typeof state === 'string') {
		return resource.state === state;
	}
	if (typeof state === 'function') {
		return state();
	}
	if (Array.isArray(state)) {
		return !state.every((v) => resource.state === v);
	}
	return false;
};

const headerIconDisabled = (iconDisabled, resource) =>
	typeof iconDisabled === 'function' ? iconDisabled(resource) : iconDisabled;

const TIMEOUT_MAX = 7000;

class ProgressTimer {
	constructor(comp) {
		this.comp = comp;
		this.timerId = null;
		this._failed = false;
	}

	get failed() {
		return this._failed;
	}

	start() {
		if (!this.timerId) {
			this._failed = false;
			this.timerId = setTimeout(() => {
				this._failed = true;
				this.comp.setState({ progressing: false });
				this.comp.forceUpdate();
			}, TIMEOUT_MAX);
		}
	}

	stop() {
		if (this.timerId) {
			clearTimeout(this.timerId);
			this.timerId = null;
		}
	}

	reset() {
		this._failed = false;
	}
}

export default class ResourceCardHeader extends React.Component {
	static propTypes = {
		icon: PropTypes.element,
		headerIcons: PropTypes.arrayOf(PropTypes.object),
		headerBackgroundColor: PropTypes.string,
		handleClicked: PropTypes.func,
		resource: PropTypes.object.isRequired,
		handleOpenMenu: PropTypes.func,
		onResourceOpen: PropTypes.func,
		titleAttribute: PropTypes.string,
		titleMaxLength: PropTypes.number,
		menuOptions: PropTypes.array,
		onMenuSelect: PropTypes.func,
		buttonColor: PropTypes.string,
		buttonColorDisabled: PropTypes.string,
		disabled: PropTypes.bool,
		showState: PropTypes.bool,
		showProgressing: PropTypes.bool,
		toggleResourceProgress: PropTypes.func,
		preventTimeOut: PropTypes.bool
	};

	static defaultProps = {
		icon: undefined,
		headerIcons: [],
		headerBackgroundColor: undefined,
		handleOpenMenu: undefined,
		titleAttribute: 'name',
		titleMaxLength: undefined,
		onResourceOpen: undefined,
		menuOptions: undefined,
		handleClicked: () => {},
		onMenuSelect: () => {},
		buttonColor: undefined,
		buttonColorDisabled: undefined,
		disabled: false,
		showProgressing: true,
		showState: false,
		preventTimeOut: false,
		toggleResourceProgress: () => {}
	};

	static getDerivedStateFromProps(props, state) {
		if (props.resource && props.resource.progressing !== state.progressing) {
			if (props.preventTimeOut && state.timer.failed) {
				const { toggleResourceProgress, resource } = props;
				state.timer.reset();
				if (typeof toggleResourceProgress === 'function') {
					toggleResourceProgress(resource);
				}
				return { ...state, progressing: false };
			}
			if (props.preventTimeOut) {
				if (props.resource.progressing === true) {
					state.timer.start();
				} else {
					state.timer.stop();
				}
			}
			return { ...state, progressing: props.resource.progressing };
		}
		return { ...state };
	}

	constructor(props) {
		super(props);
		this.state = {
			progressing: props.resource.progressing,
			timer: props.preventTimeOut ? new ProgressTimer(this) : undefined
		};
	}

	componentWillUnmount() {
		if (this.props.preventTimeOut) {
			this.state.timer.stop();
		}
	}

	render() {
		const {
			headerIcons,
			handleClicked,
			resource,
			handleOpenMenu,
			onResourceOpen,
			titleAttribute,
			icon,
			titleMaxLength,
			showState,
			menuOptions,
			onMenuSelect,
			showProgressing,
			disabled
		} = this.props;
		const { progressing } = this.state;
		const showControls = !showProgressing || !disabled;
		let title = shorten(jsonPath(resource, titleAttribute) || resource.name,
			titleMaxLength);
		if (showState) {
			title = `${title} (${resource.state})`;
		}
		return (
			<div>
				<CardHeader
					style={{
						padding: '0px 10px',
						color: 'white',
						textDecoration: resource.disabled ? 'line-through' : 'inherit',
						alignSelf: 'center',
						backgroundColor: this.props.headerBackgroundColor
					}}
					avatar={icon}
					action={
						<div
							style={{
								marginTop: '4px',
							}}
						>
							{headerIcons.length > 0 ? (
								<div
									style={{
										marginTop: '9px',
										display: 'inline'
									}}
								>
									{showControls &&
										headerIcons
											.filter(
												(h) =>
													(resource.disabled !== true ||
														h.onDisabled === resource.disabled) &&
													!headerIconDisabled(h.disabled, resource)
											)
											.map((h) => (
												<ResourceHeaderButton
													buttonColor={this.props.buttonColor}
													buttonColorDisabled={this.props.buttonColorDisabled}
													key={`headerbutton-${resource.id}-${h.menuId}`}
													icon={h.icon}
													onChange={() => handleClicked(h.menuId, resource.id)}
													state={getState(h.state, resource)}
													label={h.label}
												/>
											))}
								</div>
							) : null}
							<ResourceMenu
								handleOpenMenu={handleOpenMenu}
								menuOptions={menuOptions}
								resourceId={resource.id}
								onMenuSelect={onMenuSelect}
							/>
						</div>
					}
					title={ showState ? (
						<div
							style={{
								cursor: 'pointer',
								color: 'white',
								fontWeight: '300',
								fontSize: '11pt',
							}}
							onClick={onResourceOpen ? () => onResourceOpen(resource,
								true) : null}
							title={jsonPath(resource, titleAttribute) ||
							resource.name}
						>
							{title}
							{progressing === true && showProgressing ? <LinearProgress
								style={{ width: '90%' }}/> : null}
						</div> ) : null}
				/>
				{ !showState && progressing === true && showProgressing ? <LinearProgress style={{ width: '70%', display: 'block', marginLeft: '40px' }} /> : null}
			</div>
		);
	}
}
