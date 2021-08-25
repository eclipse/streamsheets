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
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/Clear';
import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import IdGenerator from '@cedalo/id-generator';

const buildEvent = (name, value) => ({
	target: {
		name,
		value,
		type: 'TextFieldsPair'
	}
});

export default function MultiTextFieldPairs(props) {
	const [pairs, setPairs] = useState([]);
	const [focusIndex, setFocusIndex] = useState(0);
	useEffect(() => {
		setPairs([...Object.entries(props.value), []].map((pair) => ({ key: IdGenerator.generate(), pair })));
	}, []);

	useEffect(() => {
		const pairsNoDuplicatKeys = pairs
			.map(({ pair }) => pair)
			.reduce((acc, p) => (p[0] && p[1] ? { ...acc, [p[0]]: acc[p[0]] || p[1] } : acc), {});
		props.onChange(buildEvent(props.name, pairsNoDuplicatKeys));
	}, [pairs]);

	const updatePairs = (newPairs) => {
		const newPairs_ = [
			...newPairs.filter(({ pair }) => pair[0] || pair[1]),
			{ key: IdGenerator.generate(), pair: [] }
		];
		setPairs(newPairs_);
	};

	const onRemovePair = (index) => updatePairs([...pairs.slice(0, index), ...pairs.slice(index + 1, pairs.length)]);
	const onChangeKey = (index, newKey) =>
		updatePairs(
			pairs.map((keyedPair, i) => (i === index ? { ...keyedPair, pair: [newKey, keyedPair.pair[1]] } : keyedPair))
		);
	const onChangeValue = (index, newValue) =>
		updatePairs(
			pairs.map((keyedPair, i) =>
				i === index ? { ...keyedPair, pair: [keyedPair.pair[0], newValue] } : keyedPair
			)
		);

	const firstOccurence = pairs
		.map(({ pair }) => pair)
		.reduce((acc, [k], i) => (k ? { ...acc, [k]: acc[k] === undefined ? i : acc[k] } : acc), {});

	// Don't show error for empty last row and current row
	const showError = (i) => i !== pairs.length - 1 && i !== focusIndex;
	return (
		<Grid container direction="column" style={{ maringTop: '10px', marginBottom: '10px' }}>
			<Grid item xs={12} style={{ marginBottom: '8px' }}>
				<Typography>{props.label}</Typography>
			</Grid>
			{pairs.map(({ key, pair: [k, v] }, i) => {
				const isDuplicate = firstOccurence[k] !== undefined && firstOccurence[k] !== i;
				const missingKey = showError(i) && !k;
				const missingValue = showError(i) && !v;
				return (
					// eslint-disable-next-line
					<Grid container item key={key}>
						<Grid item xs={5} style={{ marginLeft: '10px', marginBottom: '5px' }}>
							<TextField
								variant="outlined"
								size="small"
								disabled={props.disabled}
								value={k || ''}
								onChange={(event) => onChangeKey(i, event.target.value)}
								style={{ width: '100%' }}
								error={isDuplicate || missingKey}
								helperText={isDuplicate ? <FormattedMessage
									id="Stream.MultiTextFieldPair.DuplicateKey"
									defaultMessage="Key already in use"
								/> : null}
								onFocus={() => setFocusIndex(i)}
								onBlur={() => setFocusIndex(-1)}
							/>
						</Grid>
						<Grid item xs={5} style={{ marginLeft: '10px' }}>
							<TextField
								variant="outlined"
								size="small"
								disabled={props.disabled}
								value={v}
								onChange={(event) => onChangeValue(i, event.target.value)}
								style={{ width: '100%' }}
								error={missingValue}
								onFocus={() => setFocusIndex(i)}
								onBlur={() => setFocusIndex(-1)}
							/>
						</Grid>
						{k || v ? (
							<Grid item style={{ marginLeft: '10px' }}>
								<Tooltip
									enterDelay={300}
									title={
										<FormattedMessage
											id="Extensions.Machinedata.Delete.Tooltip"
											defaultMessage="Delete"
										/>
									}
								>
									<IconButton style={{ padding: '8px' }} onClick={() => onRemovePair(i)}>
										<DeleteIcon />
									</IconButton>
								</Tooltip>{' '}
							</Grid>
						) : null}
					</Grid>
				);
			})}
		</Grid>
	);
}
