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
import {
	Paper,
	Typography,
	IconButton,
	Table,
	TableBody,
	TableRow,
	TableCell,
	Collapse
} from '@material-ui/core';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import AddCircle from '@material-ui/icons/AddCircleOutline';
import StreamHelper from '../../helper/StreamHelper';

const styles = () => ({
	typoRoot: {
		fontSize: '9pt',
		fontWeight: 'bold',
		margin: '0px',
		minWidth: '75px',
		paddingBottom: '7px',
		paddingTop: '7px'
	},
	sectionRoot: {
		display: 'flex',
		margin: '10px 0px 0px 14px',
		borderBottom: `1px solid #e0e0e0`,
		paddingBottom: '0px',
		paddingTop: '4px'
	},
});


const StreamTableRow = ((props) => {
	const { classes, row } = props;
	const [open, setOpen] = React.useState(false);
	const handleClick = (type) => {
		props.onStreamNew(type, row);
	};

	return (
		<React.Fragment>
			<TableRow
				style={{ textDecoration: row.disabled ? 'line-through' : 'inherit' }}
				classes={{ root: classes.tableRoot }}
			>
				<TableCell style={{ width: '20px' }} padding="none" align="left">
					<IconButton
						style={{ margin: '0px 5px', padding: '4px' }}
						aria-label="expand row"
						size="small"
						onClick={() => setOpen(!open)}
					>
						{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
					</IconButton>
				</TableCell>
				<TableCell
					onClick={() => setOpen(!open)}
					style={{ cursor: 'pointer', fontWeight: 'bold' }}
					padding="none"
					component="th"
					scope="row"
					align="left"
				>
					{row.name}
				</TableCell>
				<TableCell onClick={() => setOpen(!open)} padding="none" align="left">
					{row.provider}
				</TableCell>
				<TableCell onClick={() => setOpen(!open)} padding="none" align="left">
					{row.url}
				</TableCell>
				<TableCell onClick={() => setOpen(!open)} padding="none" align="left">
					{row.topic}
				</TableCell>
				<TableCell onClick={() => setOpen(!open)} padding="none" align="left">
					{row.lastModified}
				</TableCell>
				<TableCell padding="none" align="left">
					<IconButton style={{ padding: '4px' }} size="small" onClick={() => props.onStreamOpen(row, 'connector')}>
						<IconEdit />
					</IconButton>
					<IconButton
						style={{ padding: '4px' }}
						size="small"
						onClick={() => props.onStreamDelete(row, 'connectors')}
					>
						<IconDelete />
					</IconButton>
					<IconButton style={{ padding: '4px' }} size="small" onClick={() => props.onStreamReload(row)}>
						<IconReload />
					</IconButton>
				</TableCell>
			</TableRow>
			<TableRow style={{ height: '0px' }}>
				<TableCell
					style={{ paddingBottom: open ? '6px' : '0px', paddingTop: '0px', paddingLeft: '40px' }}
					colSpan={7}
				>
					<Collapse in={open} timeout="auto" unmountOnExit>
						<Paper square elevation={1}>
							<div
								className={classes.sectionRoot}
							>
								<Typography
									classes={{ root: classes.typoRoot }}
									color="textSecondary"
									variant="body1"
									gutterBottom
									component="div"
								>
									Consumers
								</Typography>
								<IconButton style={{padding: '2px'}} size="small" onClick={() => handleClick('consumer')}>
									<AddCircle />
								</IconButton>
							</div>
							<Table size="small" aria-label="purchases">
								<TableBody>
									{row.consumers.map((historyRow) => (
										<TableRow key={historyRow.date}>
											<TableCell
												style={{ width: '20px', borderBottom: 'none' }}
												padding="none"
												align="left"
											/>
											<TableCell
												style={{ cursor: 'pointer', width: '12%' }}
												padding="none"
												align="left"
												onClick={() => props.onStreamOpen(historyRow, 'consumer')}
											>
												<img
													style={{ verticalAlign: 'bottom', paddingRight: '6px' }}
													width={15}
													height={15}
													src={StreamHelper.getIconForState(historyRow.state)}
													alt="state"
												/>
												{historyRow.name}
											</TableCell>
											<TableCell style={{ width: '10%' }} padding="none" align="left">
												{historyRow.provider}
											</TableCell>
											<TableCell style={{ width: '15%' }} padding="none" align="left">
												{historyRow.url}
											</TableCell>
											<TableCell padding="none" align="left">
												{historyRow.topic}
											</TableCell>
											<TableCell style={{ width: '10%' }} padding="none" align="left">
												{historyRow.lastModified}
											</TableCell>
											<TableCell  style={{ width: '10%' }} padding="none" align="left">
												<IconButton
													style={{ padding: '4px' }}
													size="small"
													onClick={() => props.onStreamOpen(historyRow, 'consumer')}
												>
													<IconEdit />
												</IconButton>
												<IconButton
													style={{ padding: '4px' }}
													size="small"
													onClick={() => props.onStreamDelete(historyRow, 'consumers')}
												>
													<IconDelete />
												</IconButton>
												<IconButton
													style={{ padding: '4px' }}
													size="small"
													onClick={() => props.onStreamReload(historyRow)}
												>
													<IconReload />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							<div
								className={classes.sectionRoot}
							>
								<Typography
									classes={{ root: classes.typoRoot }}
									color="textSecondary"
									variant="body1"
									gutterBottom
									component="div"
								>
									Producers
								</Typography>
								<IconButton style={{padding: '2px'}} size="small" onClick={() => handleClick('producer')}>
									<AddCircle />
								</IconButton>
							</div>
							<Table size="small" aria-label="purchases">
								<TableBody>
									{row.producers.map((historyRow) => (
										<TableRow key={historyRow.date}>
											<TableCell
												style={{ width: '20px', borderBottom: 'none' }}
												padding="none"
												align="left"
											/>
											<TableCell
												style={{ cursor: 'pointer', width: '12%' }}
												padding="none"
												align="left"
												onClick={() => props.onStreamOpen(historyRow, 'producer')}
											>
												<img
													style={{ verticalAlign: 'bottom', paddingRight: '6px' }}
													width={15}
													height={15}
													src={StreamHelper.getIconForState(historyRow.state)}
													alt="state"
												/>
												{historyRow.name}
											</TableCell>
											<TableCell style={{ width: '15%' }} padding="none" align="left">
												{historyRow.provider}
											</TableCell>
											<TableCell style={{ width: '10%' }} padding="none" align="left">
												{historyRow.url}
											</TableCell>
											<TableCell padding="none" align="left">
												{historyRow.topic}
											</TableCell>
											<TableCell style={{ width: '10%' }} padding="none" align="left">
												{historyRow.lastModified}
											</TableCell>
											<TableCell  style={{ width: '10%' }} padding="none" align="left">
												<IconButton
													style={{ padding: '4px' }}
													size="small"
													onClick={() => props.onStreamOpen(historyRow, 'producer')}
												>
													<IconEdit />
												</IconButton>
												<IconButton
													style={{ padding: '4px' }}
													size="small"
													onClick={() => props.onStreamDelete(historyRow, 'producers')}
												>
													<IconDelete />
												</IconButton>
												<IconButton
													style={{ padding: '4px' }}
													size="small"
													onClick={() => props.onStreamReload(historyRow)}
												>
													<IconReload />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Paper>
					</Collapse>
				</TableCell>
			</TableRow>
		</React.Fragment>
	);
});

StreamTableRow.propTypes = {
	row: PropTypes.object.isRequired
};

export default withStyles(styles)(StreamTableRow)
