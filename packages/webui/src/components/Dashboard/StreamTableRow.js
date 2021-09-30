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
/* eslint-disable react/forbid-prop-types,react/no-unused-prop-types */
/* eslint-disable react/prop-types */
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import React from 'react';
// import { FormattedMessage, injectIntl } from 'react-intl';
import { IconEdit, IconDelete, IconReload } from '../icons';
import { Typography, IconButton, Table, TableBody, TableRow, TableCell, Collapse } from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import AddCircle from '@material-ui/icons/AddCircleOutline';
import StreamHelper from '../../helper/StreamHelper';
import { FormattedMessage } from 'react-intl';
import Tooltip from '@material-ui/core/Tooltip';

const styles = (theme) => ({
	[theme.breakpoints.down('sm')]: {
		hideOnSmallDisplays: {
			display: 'none'
		}
	},
	emptyTableRow: {
		// TODO: should be handled by Material UI table settings, but somehow isn't
		height: '30px',
	},
	tableCell: {
		border: 'none',
	},
	typoRoot: {
		fontSize: '9pt', 
		fontWeight: 'bold', 
		margin: '0px', 
		minWidth: '75px', 
		paddingBottom: '7px', 
		paddingTop: '7px',
	},
	sectionRoot: {
		display: 'flex',
		margin: '10px 0px 0px 40px',
		borderBottom: `1px solid #e0e0e0`,
		paddingBottom: '0px',
		paddingTop: '4px'
	}
});

const StreamTableRow = (props) => {
	const { classes, row } = props;
	const [open, setOpen] = React.useState(false);
	const handleClick = (type) => {
		props.onStreamNew(type, row);
	};

	if (row.open) {
		setOpen(true);
		row.open = undefined;
		return (<div />);
	}
	const openConnector = open;

	return (<React.Fragment>
		<TableRow
			style={{
				border: 'none',
				textDecoration: row.disabled ? 'line-through' : 'inherit', height: '40px'
			}}
			hover
			classes={{ root: classes.tableRoot }}
			key={row.id}
		>
			<TableCell className={classes.tableCell} style={{ width: '20px' }} padding='none' align='left'>
				<IconButton
					style={{ margin: '0px 5px', padding: '4px' }}
					aria-label='expand row'
					size='small'
					onClick={() => setOpen(!open)}
				>
					{openConnector ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
				</IconButton>
			</TableCell>
			<TableCell
			 	className={classes.tableCell}
				onClick={() => setOpen(!openConnector)}
				style={{ cursor: 'pointer', fontWeight: 'bold' }}
				padding='none'
				component='th'
				scope='row'
				align='left'
			>
				{row.name}
			</TableCell>
			<TableCell 
			 	className={`${classes.tableCell} ${classes.hideOnSmallDisplays}`}
				style={{ cursor: 'pointer' }} onClick={() => setOpen(!openConnector)} padding='none'
				align='left'>
				{row.provider.name}
			</TableCell>
			<TableCell 
			 	className={`${classes.tableCell} ${classes.hideOnSmallDisplays}`}
				style={{ cursor: 'pointer' }} onClick={() => setOpen(!openConnector)} padding='none'
				align='left'>
				{row.url}
			</TableCell>
			<TableCell
			 	className={`${classes.tableCell} ${classes.hideOnSmallDisplays}`}
				style={{ cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '1000px' }}
				onClick={() => setOpen(!openConnector)} padding='none' align='left'>
				{row.topic}
			</TableCell>
			<TableCell 
			 	className={`${classes.tableCell} ${classes.hideOnSmallDisplays}`}
				style={{ cursor: 'pointer' }} onClick={() => setOpen(!openConnector)} padding='none'
				align='left'>
				{row.lastModified}
			</TableCell>
			<TableCell 
			 	className={classes.tableCell}
				padding='none' align='left'>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Dashboard.EditConnector' defaultMessage='Edit Connector' />}
				>
					<IconButton
						style={{ padding: '4px' }}
						size='small'
						onClick={() => props.onStreamOpen(row, 'connector')}
					>
						<IconEdit />
					</IconButton>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Dashboard.DeleteConnector' defaultMessage='Delete Connector' />}
				>
					<IconButton
						style={{ padding: '4px' }}
						size='small'
						onClick={() => props.onStreamDelete(row, 'connectors')}
					>
						<IconDelete />
					</IconButton>
				</Tooltip>
				<Tooltip
					enterDelay={300}
					title={<FormattedMessage id='Dashboard.ReloadConnector' defaultMessage='Reload Connector' />}
				>
					<IconButton style={{ padding: '4px' }} size='small' onClick={() => props.onStreamReload(row)}>
						<IconReload />
					</IconButton>
				</Tooltip>
			</TableCell>
		</TableRow>
		<TableRow key={`sub${row.id}`} style={{ height: '0px', border: 'none' }}>
			<TableCell
				style={{
					paddingBottom: openConnector ? '6px' : '0px',
					paddingTop: '0px',
					paddingLeft: '0px',
					paddingRight: '0px'
				}}
				colSpan={7}
			>
				<Collapse in={openConnector} timeout='auto' unmountOnExit>
					<div square elevation={1} style={{ maxHeight: 'none', maxWidth: 'none' }}>
						{row.provider.canConsume ? (<React.Fragment>
							<div className={classes.sectionRoot}>
								<Typography
									classes={{ root: classes.typoRoot }}
									color='textSecondary'
									variant='body2'
									gutterBottom
									component='div'
								>
									<FormattedMessage id='Dashboard.consumers' defaultMessage='Consumers' />
								</Typography>
								<Tooltip
									enterDelay={300}
									title={<FormattedMessage id='Dashboard.NewConsumer'
										defaultMessage='New Consumer' />}
								>
									<IconButton
										style={{ padding: '2px' }}
										size='small'
										onClick={() => handleClick('consumer')}
									>
										<AddCircle />
									</IconButton>
								</Tooltip>
							</div>
							<Table className={classes.table} size='medium' aria-label='consumers'>
								<TableBody>
									{
										row.consumers.length === 0 && 
										<TableRow
											className={classes.emptyTableRow}
										>
											<TableCell
												style={{ width: '40px', borderBottom: 'none' }}
												padding='none'
												align='left'
											/>
											<TableCell
												style={{ columnSpan: 6 }}
												padding='none'
												align='left'
											>
												No consumers yet
											</TableCell>
										</TableRow>
									}
									{row.consumers.map((historyRow) => (<TableRow
										style={{
											textDecoration: row.disabled || historyRow.disabled ? 'line-through' :
												'inherit'
										}}
										hover
										key={historyRow.id}
									>
										<TableCell
											style={{ width: '40px', borderBottom: 'none' }}
											padding='none'
											align='left'
										/>
										<TableCell
											style={{ cursor: 'pointer', width: '12%', minWidth: '250px' }}
											padding='none'
											align='left'
											onClick={() => props.onStreamOpen(historyRow, 'consumer')}
										>
											<img
												style={{ verticalAlign: 'bottom', paddingRight: '6px' }}
												width={15}
												height={15}
												src={StreamHelper.getIconForState(historyRow.state)}
												alt='state'
											/>
											{historyRow.name}
										</TableCell>
										<TableCell style={{ width: '10%', minWidth: '170px' }} padding='none'
											align='left'>
											{historyRow.provider.name}
										</TableCell>
										<TableCell style={{ width: '20%' }} padding='none' align='left'
											className={classes.hideOnSmallDisplays} >
											{historyRow.url}
										</TableCell>
										<TableCell padding='none' align='left' style={{
												overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '1000px'
											}}
											className={classes.hideOnSmallDisplays} >
											{historyRow.topic}
										</TableCell>
										<TableCell style={{ width: '120px', minWidth: '120px' }} padding='none'
											align='left' 
											className={classes.hideOnSmallDisplays} >
											{historyRow.lastModified}
										</TableCell>
										<TableCell style={{ width: '95px', minWidth: '95px' }} padding='none'
											align='left'>
											<Tooltip
												enterDelay={300}
												title={<FormattedMessage id='Dashboard.EditConsumer'
													defaultMessage='Edit Consumer' />}
											>
												<IconButton
													style={{ padding: '4px' }}
													size='small'
													onClick={() => props.onStreamOpen(historyRow, 'consumer')}
												>
													<IconEdit />
												</IconButton>
											</Tooltip>
											<Tooltip
												enterDelay={300}
												title={<FormattedMessage id='Dashboard.DeleteConsumer'
													defaultMessage='Delete Consumer' />}
											>
												<IconButton
													style={{ padding: '4px' }}
													size='small'
													onClick={() => props.onStreamDelete(historyRow, 'consumers')}
												>
													<IconDelete />
												</IconButton>
											</Tooltip>
											<Tooltip
												enterDelay={300}
												title={<FormattedMessage id='Dashboard.ReloadConsumer'
													defaultMessage='Reload Consumer' />}
											>
												<IconButton
													style={{ padding: '4px' }}
													size='small'
													onClick={() => props.onStreamReload(historyRow)}
												>
													<IconReload />
												</IconButton>
											</Tooltip>
										</TableCell>
									</TableRow>))}
								</TableBody>
							</Table>
						</React.Fragment>) : null}
						{row.provider.canProduce ? (<React.Fragment>
							<div className={classes.sectionRoot}>
								<Typography
									classes={{ root: classes.typoRoot }}
									color='textSecondary'
									variant='body2'
									gutterBottom
									component='div'
								>
									<FormattedMessage id='Dashboard.producers' defaultMessage='Producers' />
								</Typography>
								<Tooltip
									enterDelay={300}
									title={<FormattedMessage id='Dashboard.NewProducer'
										defaultMessage='Edit Producer' />}
								>
									<IconButton
										style={{ padding: '2px' }}
										size='small'
										onClick={() => handleClick('producer')}
									>
										<AddCircle />
									</IconButton>
								</Tooltip>
							</div>
							<Table className={classes.table} size='medium' aria-label='producers'>
								<TableBody>
									{
										row.producers.length === 0 && 
										<TableRow
											className={classes.emptyTableRow}
										>
											<TableCell
												style={{ width: '40px', borderBottom: 'none' }}
												padding='none'
												align='left'
											/>
											<TableCell
												style={{ columnSpan: 6 }}
												padding='none'
												align='left'
											>
												No producers yet
											</TableCell>
										</TableRow>
									}
									{row.producers.map((historyRow) => (<TableRow
										style={{
											textDecoration: row.disabled || historyRow.disabled ? 'line-through' :
												'inherit'
										}}
										hover
										key={historyRow.id}
									>
										<TableCell
											style={{ width: '40px', borderBottom: 'none' }}
											padding='none'
											align='left'
										/>
										<TableCell
											style={{ cursor: 'pointer', width: '12%', minWidth: '250px' }}
											padding='none'
											align='left'
											onClick={() => props.onStreamOpen(historyRow, 'producer')}
										>
											<img
												style={{ verticalAlign: 'bottom', paddingRight: '6px' }}
												width={15}
												height={15}
												src={StreamHelper.getIconForState(historyRow.state)}
												alt='state'
											/>
											{historyRow.name}
										</TableCell>
										<TableCell style={{ width: '10%', minWidth: '170px' }} padding='none'
											align='left'
											className={classes.hideOnSmallDisplays} >
											{historyRow.provider.name}
										</TableCell>
										<TableCell style={{ width: '20%' }} padding='none' align='left'
											className={classes.hideOnSmallDisplays} >
											{historyRow.url}
										</TableCell>
										<TableCell padding='none' align='left' style={{
												overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '1000px'
											}}
											className={classes.hideOnSmallDisplays} >
											{historyRow.topic}
										</TableCell>
										<TableCell style={{ width: '120px', minWidth: '120px' }} padding='none'
											align='left'
											className={classes.hideOnSmallDisplays} >
											{historyRow.lastModified}
										</TableCell>
										<TableCell style={{ width: '95px', minWidth: '95px' }} padding='none'
											align='left'>
											<Tooltip
												enterDelay={300}
												title={<FormattedMessage id='Dashboard.EditProducer'
													defaultMessage='Edit Producer' />}
											>
												<IconButton
													style={{ padding: '4px' }}
													size='small'
													onClick={() => props.onStreamOpen(historyRow, 'producer')}
												>
													<IconEdit />

												</IconButton>
											</Tooltip>
											<Tooltip
												enterDelay={300}
												title={<FormattedMessage id='Dashboard.DeleteProducer'
													defaultMessage='Delete Producer' />}
											>
												<IconButton
													style={{ padding: '4px' }}
													size='small'
													onClick={() => props.onStreamDelete(historyRow, 'producers')}
												>
													<IconDelete />
												</IconButton>
											</Tooltip>
											<Tooltip
												enterDelay={300}
												title={<FormattedMessage id='Dashboard.ReloadProducer'
													defaultMessage='Reload Producer' />}
											>
												<IconButton
													style={{ padding: '4px' }}
													size='small'
													onClick={() => props.onStreamReload(historyRow)}
												>
													<IconReload />
												</IconButton>
											</Tooltip>
										</TableCell>
									</TableRow>))}
								</TableBody>
							</Table>
						</React.Fragment>) : null}
					</div>
				</Collapse>
			</TableCell>
		</TableRow>
	</React.Fragment>);
};

StreamTableRow.propTypes = {
	row: PropTypes.object.isRequired
};

export default withStyles(styles)(StreamTableRow);
