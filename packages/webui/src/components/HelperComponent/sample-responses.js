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
export default {
	response: {
		type: 'response',
		requestId: 'ab393b90-f089-11e7-903c-37f84382dbe2',
		requestType: 'machine_load',
		machineserver: {
			machine: {
				id: 'HyZdL8cQz',
				name: 'Machine330',
				mode: 'uncontrolled',
				state: 'stopped',
				isTemplate: false,
				streamsheets: [
					{
						id: 'rkWZuLLqmz',
						name: 'P1',
						loop: {
							path: '',
							enabled: true,
						},
						inbox: {
							max: 100,
							type: 'Inbox',
							id: 'SyzZOLL9XG',
						},
						sheet: {
							cells: {},
						},
						trigger: {
							type: 'arrival',
							repeat: 'once',
						},
					},
				],
				settings: {},
				_id: 'HyZdL8cQz',
			},
		},
		graphserver: {
			graph: {
				id: 'B1W_8L9mG',
				graphdef: {
					'o-al': {
						n: 'model.attributes',
						'a-al': [
							{
								n: 'format',
								cl: 'JSG.graph.attr.FormatAttributes',
								'a-al': [
									{
										n: 'linecolor',
										'o-vl': {
											v: '%23AAAAAA',
											t: 's',
										},
									},
									{
										n: 'fillcolor',
										'o-vl': {
											v: '%23EEEEEE',
											t: 's',
										},
									},
								],
							},
							{
								n: 'graphitem',
								cl: 'JSG.graph.attr.ItemAttributes',
								'a-al': [
									{
										n: 'selectionmode',
										'o-vl': {
											v: '0',
										},
									},
									{
										n: 'portmode',
										'o-vl': {
											v: '0',
										},
									},
									{
										n: 'clipchildren',
										'o-vl': {
											v: 'true',
											t: 'b',
										},
									},
									{
										n: 'container',
										'o-vl': {
											v: 'false',
											t: 'b',
										},
									},
									{
										n: 'MachineSpeed',
										cl: 'JSG.graph.attr.NumberAttribute',
										'o-vl': {
											v: '100',
										},
									},
								],
							},
							{
								n: 'defaults',
								'a-al': [
									{
										n: 'header',
										'a-al': [
											{
												n: 'margin',
												cl: 'JSG.graph.attr.NumberAttribute',
												'o-vl': {
													v: '500',
												},
											},
											{
												n: 'left',
												'a-al': [
													{
														n: 'text',
														cl: 'JSG.graph.attr.StringAttribute',
														'o-vl': {
															v: '',
															t: 's',
														},
													},
												],
											},
											{
												n: 'center',
												'a-al': [
													{
														n: 'text',
														cl: 'JSG.graph.attr.StringAttribute',
														'o-vl': {
															v: '',
															t: 's',
														},
													},
												],
											},
											{
												n: 'right',
												'a-al': [
													{
														n: 'text',
														cl: 'JSG.graph.attr.StringAttribute',
														'o-vl': {
															v: '',
															t: 's',
														},
													},
												],
											},
										],
									},
									{
										n: 'footer',
										'a-al': [
											{
												n: 'margin',
												cl: 'JSG.graph.attr.NumberAttribute',
												'o-vl': {
													v: '500',
												},
											},
											{
												n: 'left',
												'a-al': [
													{
														n: 'text',
														cl: 'JSG.graph.attr.StringAttribute',
														'o-vl': {
															v: '',
															t: 's',
														},
													},
												],
											},
											{
												n: 'center',
												'a-al': [
													{
														n: 'text',
														cl: 'JSG.graph.attr.StringAttribute',
														'o-vl': {
															v: '',
															t: 's',
														},
													},
												],
											},
											{
												n: 'right',
												'a-al': [
													{
														n: 'text',
														cl: 'JSG.graph.attr.StringAttribute',
														'o-vl': {
															v: '',
															t: 's',
														},
													},
												],
											},
										],
									},
								],
							},
						],
					},
					'o-type': {
						v: 'B1W_8L9mG',
						t: 's',
					},
					type: 'machinegraph',
					uniqueid: '1',
					'o-settings': {
						viewmode: 'jsg:vm:default',
						dplmode: '0',
						pageborder: 'false',
						grid: 'false',
						gridstyle: '0',
						origin: 'false',
						ports: 'false',
						porthighlights: 'false',
						porthighlightdelay: '600',
						names: 'false',
						availableports: 'false',
						scale: 'false',
						scaleendless: 'false',
						selecttoponly: 'true',
						snaptogrid: 'true',
						snaptoshapes: 'true',
						snaprotation: 'true',
						snaptoport: '510',
						snapstep: '250',
						autoscroll: 'true',
						panningenabled: 'false',
						'o-pagedescr': {
							'o-pf': {
								n: 'A4',
								o: '1',
								m: '2000,1500,1500,2000',
							},
							scale: '1',
							scaletopagesvertical: '-1',
							scaletopageshorizontal: '-1',
							'o-gaps': {
								h: '500',
								v: '1000',
							},
							'o-col': {
								f: '0',
								l: '0',
							},
							'o-row': {
								f: '0',
								l: '0',
							},
							'o-headers': {},
							'o-footers': {},
						},
					},
					'o-layers': {},
					'o-pin': {
						'o-p': {
							'o-x': {
								v: '0',
							},
							'o-y': {
								v: '0',
							},
						},
						'o-lp': {
							'o-x': {
								v: '0',
							},
							'o-y': {
								v: '0',
							},
						},
					},
					'o-size': {
						'o-w': {
							v: '29700',
						},
						'o-h': {
							v: '21000',
						},
					},
					'o-shape': {
						type: 'boundingbox',
					},
					'a-graphitem': [
						{
							id: '545181910840',
							'o-al': {
								n: 'model.attributes',
								'a-al': [
									{
										n: 'graphitem',
										cl: 'JSG.graph.attr.ItemAttributes',
										'a-al': [
											{
												n: 'selectionmode',
												'o-vl': {
													v: '0',
												},
											},
											{
												n: 'portmode',
												'o-vl': {
													v: '0',
												},
											},
											{
												n: 'container',
												'o-vl': {
													v: 'false',
													t: 'b',
												},
											},
										],
									},
								],
							},
							'o-name': {
								v: 'MachineContainer545181910840',
								t: 's',
							},
							'o-pin': {
								'o-p': {
									'o-x': {
										v: '0',
									},
									'o-y': {
										v: '0',
									},
								},
								'o-lp': {
									'o-x': {
										f: 'WIDTH%20*%200.5',
										v: '0',
									},
									'o-y': {
										f: 'HEIGHT%20*%200.5',
										v: '0',
									},
								},
							},
							'o-size': {
								'o-w': {
									v: '0',
								},
								'o-h': {
									v: '0',
								},
							},
							'o-shape': {
								type: 'rectangle',
							},
							'a-graphitem': [
								{
									id: '484408115484',
									parentid: '545181910840',
									'o-al': {
										n: 'model.attributes',
										'a-al': [
											{
												n: 'format',
												cl: 'JSG.graph.attr.FormatAttributes',
												'a-al': [
													{
														n: 'linecolor',
														'o-vl': {
															v: '%23AAAAAA',
															t: 's',
														},
													},
												],
											},
											{
												n: 'graphitem',
												cl: 'JSG.graph.attr.ItemAttributes',
												'a-al': [
													{
														n: 'selectionmode',
														'o-vl': {
															v: '0',
														},
													},
													{
														n: 'portmode',
														'o-vl': {
															v: '0',
														},
													},
													{
														n: 'clipchildren',
														'o-vl': {
															v: 'true',
															t: 'b',
														},
													},
												],
											},
										],
									},
									'o-name': {
										v: 'ProcessContainer484408115484',
										t: 's',
									},
									'o-pin': {
										'o-p': {
											'o-x': {
												v: '0',
											},
											'o-y': {
												v: '0',
											},
										},
										'o-lp': {
											'o-x': {
												f: 'WIDTH%20*%200.5',
												v: '0',
											},
											'o-y': {
												f: 'HEIGHT%20*%200.5',
												v: '0',
											},
										},
									},
									'o-size': {
										'o-w': {
											v: '0',
										},
										'o-h': {
											v: '0',
										},
									},
									'o-shape': {
										type: 'rectangle',
									},
									'o-scrollposition': {
										x: '0',
										y: '0',
									},
									'o-scrollmode': {
										h: '0',
										v: '0',
									},
									'a-graphitem': [
										{
											id: '1000',
											parentid: '594154943341',
											'o-al': {
												n: 'model.attributes',
												'a-al': [
													{
														n: 'graphitem',
														cl: 'JSG.graph.attr.ItemAttributes',
														'a-al': [
															{
																n: 'portmode',
																'o-vl': {
																	v: '0',
																},
															},
															{
																n: 'rotatable',
																'o-vl': {
																	v: 'false',
																	t: 'b',
																},
															},
															{
																n: 'container',
																'o-vl': {
																	v: 'false',
																	t: 'b',
																},
															},
														],
													},
													{
														n: 'StreamSheetContainer',
														cl: 'ProcessSheetContainerAttributes',
														'a-al': [
															{
																n: 'sheetid',
																'o-vl': {
																	v: 'rkWZuLLqmz',
																	t: 's',
																},
															},
														],
													},
												],
											},
											'o-name': {
												v: 'ProcessSheetContainer551691885844',
												t: 's',
											},
											'o-pin': {
												'o-p': {
													'o-x': {
														v: '14000',
													},
													'o-y': {
														v: '8500',
													},
												},
												'o-lp': {
													'o-x': {
														f: 'WIDTH%20*%200.5',
														v: '12500',
													},
													'o-y': {
														f: 'HEIGHT%20*%200.5',
														v: '7500',
													},
												},
											},
											'o-size': {
												'o-w': {
													v: '25000',
												},
												'o-h': {
													v: '15000',
												},
											},
											'o-shape': {
												type: 'rectangle',
											},
											'a-graphitem': [
												{
													id: '1001',
													parentid: '1000',
													'o-al': {
														n: 'model.attributes',
														'a-al': [
															{
																n: 'format',
																cl: 'JSG.graph.attr.FormatAttributes',
																'a-al': [
																	{
																		n: 'fillcolor',
																		'o-vl': {
																			v: '%231976d2',
																			t: 's',
																		},
																	},
																	{
																		n: 'linecolor',
																		'o-vl': {
																			v: '%23777777',
																			t: 's',
																		},
																	},
																],
															},
															{
																n: 'graphitem',
																cl: 'JSG.graph.attr.ItemAttributes',
																'a-al': [
																	{
																		n: 'portmode',
																		'o-vl': {
																			v: '0',
																		},
																	},
																	{
																		n: 'container',
																		'o-vl': {
																			v: 'false',
																			t: 'b',
																		},
																	},
																	{
																		n: 'selectionmode',
																		'o-vl': {
																			v: '0',
																		},
																	},
																],
															},
															{
																n: 'textformat',
																cl: 'JSG.graph.attr.TextFormatAttributes',
																'a-al': [
																	{
																		n: 'fontcolor',
																		'o-vl': {
																			v: '%23FFFFFF',
																			t: 's',
																		},
																	},
																	{
																		n: 'fontsize',
																		'o-vl': {
																			v: '9',
																		},
																	},
																],
															},
														],
													},
													'o-type': {
														v: 'inboxcaption',
														t: 's',
													},
													'o-name': {
														v: 'Inbox%20-%20None',
														t: 's',
													},
													'o-pin': {
														'o-p': {
															'o-x': {
																v: '0',
															},
															'o-y': {
																v: '0',
															},
														},
														'o-lp': {
															'o-x': {
																f: 'WIDTH%20*%200.5',
																v: '0',
															},
															'o-y': {
																f: 'HEIGHT%20*%200.5',
																v: '0',
															},
														},
													},
													'o-size': {
														'o-w': {
															v: '0',
														},
														'o-h': {
															v: '0',
														},
													},
													'o-shape': {
														type: 'rectangle',
													},
													type: 'captionnode',
												},
												{
													id: '1002',
													parentid: '1000',
													'o-al': {
														n: 'model.attributes',
														'a-al': [
															{
																n: 'format',
																cl: 'JSG.graph.attr.FormatAttributes',
																'a-al': [
																	{
																		n: 'linecolor',
																		'o-vl': {
																			v: '%23AAAAAA',
																			t: 's',
																		},
																	},
																],
															},
															{
																n: 'graphitem',
																cl: 'JSG.graph.attr.ItemAttributes',
																'a-al': [
																	{
																		n: 'portmode',
																		'o-vl': {
																			v: '0',
																		},
																	},
																	{
																		n: 'rotatable',
																		'o-vl': {
																			v: 'false',
																			t: 'b',
																		},
																	},
																	{
																		n: 'container',
																		'o-vl': {
																			v: 'false',
																			t: 'b',
																		},
																	},
																	{
																		n: 'selectionmode',
																		'o-vl': {
																			v: '0',
																		},
																	},
																],
															},
														],
													},
													'o-name': {
														v: 'InboxContainer459595598854',
														t: 's',
													},
													'o-pin': {
														'o-p': {
															'o-x': {
																v: '0',
															},
															'o-y': {
																v: '0',
															},
														},
														'o-lp': {
															'o-x': {
																f: 'WIDTH%20*%200.5',
																v: '2500',
															},
															'o-y': {
																f: 'HEIGHT%20*%200.5',
																v: '25',
															},
														},
													},
													'o-size': {
														'o-w': {
															v: '5000',
														},
														'o-h': {
															v: '50',
														},
													},
													type: 'inboxcontainer',
												},
												{
													id: '1020',
													parentid: '1000',
													'o-al': {
														n: 'model.attributes',
														'a-al': [
															{
																n: 'format',
																cl: 'JSG.graph.attr.FormatAttributes',
																'a-al': [
																	{
																		n: 'fillcolor',
																		'o-vl': {
																			v: '%23CFD8DC',
																			t: 's',
																		},
																	},
																	{
																		n: 'linecolor',
																		'o-vl': {
																			v: '%23AAAAAA',
																			t: 's',
																		},
																	},
																],
															},
															{
																n: 'graphitem',
																cl: 'JSG.graph.attr.ItemAttributes',
																'a-al': [
																	{
																		n: 'portmode',
																		'o-vl': {
																			v: '0',
																		},
																	},
																	{
																		n: 'container',
																		'o-vl': {
																			v: 'false',
																			t: 'b',
																		},
																	},
																],
															},
														],
													},
													'o-name': {
														v: 'Splitter441044194145',
														t: 's',
													},
													'o-pin': {
														'o-p': {
															'o-x': {
																v: '0',
															},
															'o-y': {
																v: '0',
															},
														},
														'o-lp': {
															'o-x': {
																f: 'WIDTH%20*%200.5',
																v: '25',
															},
															'o-y': {
																f: 'HEIGHT%20*%200.5',
																v: '88',
															},
														},
													},
													'o-size': {
														'o-w': {
															v: '50',
														},
														'o-h': {
															v: '175',
														},
													},
													'o-shape': {
														type: 'rectangle',
													},
													type: 'splitternode',
													direction: '1',
												},
												{
													id: '1021',
													parentid: '1000',
													'o-al': {
														n: 'model.attributes',
														'a-al': [
															{
																n: 'format',
																cl: 'JSG.graph.attr.FormatAttributes',
																'a-al': [
																	{
																		n: 'fillcolor',
																		'o-vl': {
																			v: '%231976d2',
																			t: 's',
																		},
																	},
																	{
																		n: 'linecolor',
																		'o-vl': {
																			v: '%23777777',
																			t: 's',
																		},
																	},
																],
															},
															{
																n: 'graphitem',
																cl: 'JSG.graph.attr.ItemAttributes',
																'a-al': [
																	{
																		n: 'portmode',
																		'o-vl': {
																			v: '0',
																		},
																	},
																	{
																		n: 'container',
																		'o-vl': {
																			v: 'false',
																			t: 'b',
																		},
																	},
																	{
																		n: 'selectionmode',
																		'o-vl': {
																			v: '0',
																		},
																	},
																],
															},
															{
																n: 'layoutattributes',
																cl: 'JSG.graph.attr.LayoutAttributes',
																'a-al': [
																	{
																		n: 'layout',
																		'o-vl': {
																			v: 'jsg.grid.layout',
																			t: 's',
																		},
																	},
																	{
																		n: 'settings',
																		cl: 'JSG.graph.attr.ObjectAttribute',
																		'o-vl': {
																			cl: 'JSG.graph.layout.Settings',
																		},
																	},
																],
															},
															{
																n: 'textformat',
																cl: 'JSG.graph.attr.TextFormatAttributes',
																'a-al': [
																	{
																		n: 'fontcolor',
																		'o-vl': {
																			v: '%23FFFFFF',
																			t: 's',
																		},
																	},
																	{
																		n: 'fontsize',
																		'o-vl': {
																			v: '9',
																		},
																	},
																],
															},
														],
													},
													'o-type': {
														v: 'sheetcaption',
														t: 's',
													},
													'o-name': {
														v: 'Stream%20Sheet%20-%20P1',
														t: 's',
													},
													'o-pin': {
														'o-p': {
															'o-x': {
																v: '0',
															},
															'o-y': {
																v: '0',
															},
														},
														'o-lp': {
															'o-x': {
																f: 'WIDTH%20*%200.5',
																v: '0',
															},
															'o-y': {
																f: 'HEIGHT%20*%200.5',
																v: '0',
															},
														},
													},
													'o-size': {
														'o-w': {
															v: '0',
														},
														'o-h': {
															v: '0',
														},
													},
													'o-shape': {
														type: 'rectangle',
													},
													'a-graphitem': [
														{
															id: '1022',
															parentid: '1021',
															'o-al': {
																n: 'model.attributes',
																'a-al': [
																	{
																		n: 'format',
																		cl: 'JSG.graph.attr.FormatAttributes',
																		'a-al': [
																			{
																				n: 'fillstyle',
																				'o-vl': {
																					v: '3',
																				},
																			},
																			{
																				n: 'linestyle',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'pattern',
																				'o-vl': {
																					v: 'settings',
																					t: 's',
																				},
																			},
																		],
																	},
																	{
																		n: 'graphitem',
																		cl: 'JSG.graph.attr.ItemAttributes',
																		'a-al': [
																			{
																				n: 'portmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'container',
																				'o-vl': {
																					v: 'false',
																					t: 'b',
																				},
																			},
																			{
																				n: 'selectionmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'LayoutHorizontal',
																				cl: 'JSG.graph.attr.StringAttribute',
																				'o-vl': {
																					v: 'right',
																					t: 's',
																				},
																			},
																			{
																				n: 'LayoutVertical',
																				cl: 'JSG.graph.attr.StringAttribute',
																				'o-vl': {
																					v: 'center',
																					t: 's',
																				},
																			},
																		],
																	},
																],
															},
															'o-name': {
																v: 'settings',
																t: 's',
															},
															'o-pin': {
																'o-p': {
																	'o-x': {
																		v: '0',
																	},
																	'o-y': {
																		v: '0',
																	},
																},
																'o-lp': {
																	'o-x': {
																		f: 'WIDTH%20*%200.5',
																		v: '250',
																	},
																	'o-y': {
																		f: 'HEIGHT%20*%200.5',
																		v: '250',
																	},
																},
															},
															'o-size': {
																'o-w': {
																	v: '500',
																},
																'o-h': {
																	v: '500',
																},
															},
															'o-shape': {
																type: 'rectangle',
															},
															type: 'buttonnode',
														},
														{
															id: '1023',
															parentid: '1021',
															'o-al': {
																n: 'model.attributes',
																'a-al': [
																	{
																		n: 'format',
																		cl: 'JSG.graph.attr.FormatAttributes',
																		'a-al': [
																			{
																				n: 'fillstyle',
																				'o-vl': {
																					v: '3',
																				},
																			},
																			{
																				n: 'linestyle',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'pattern',
																				'o-vl': {
																					v: 'maximize',
																					t: 's',
																				},
																			},
																		],
																	},
																	{
																		n: 'graphitem',
																		cl: 'JSG.graph.attr.ItemAttributes',
																		'a-al': [
																			{
																				n: 'portmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'container',
																				'o-vl': {
																					v: 'false',
																					t: 'b',
																				},
																			},
																			{
																				n: 'selectionmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'LayoutHorizontal',
																				cl: 'JSG.graph.attr.StringAttribute',
																				'o-vl': {
																					v: 'right',
																					t: 's',
																				},
																			},
																			{
																				n: 'LayoutVertical',
																				cl: 'JSG.graph.attr.StringAttribute',
																				'o-vl': {
																					v: 'center',
																					t: 's',
																				},
																			},
																		],
																	},
																],
															},
															'o-name': {
																v: 'maximize',
																t: 's',
															},
															'o-pin': {
																'o-p': {
																	'o-x': {
																		v: '0',
																	},
																	'o-y': {
																		v: '0',
																	},
																},
																'o-lp': {
																	'o-x': {
																		f: 'WIDTH%20*%200.5',
																		v: '250',
																	},
																	'o-y': {
																		f: 'HEIGHT%20*%200.5',
																		v: '250',
																	},
																},
															},
															'o-size': {
																'o-w': {
																	v: '500',
																},
																'o-h': {
																	v: '500',
																},
															},
															'o-shape': {
																type: 'rectangle',
															},
															type: 'buttonnode',
														},
													],
													type: 'captionnode',
												},
												{
													id: '1024',
													parentid: '1000',
													'o-al': {
														n: 'model.attributes',
														'a-al': [
															{
																n: 'format',
																cl: 'JSG.graph.attr.FormatAttributes',
																'a-al': [
																	{
																		n: 'linecolor',
																		'o-vl': {
																			v: '%23AAAAAA',
																			t: 's',
																		},
																	},
																],
															},
															{
																n: 'graphitem',
																cl: 'JSG.graph.attr.ItemAttributes',
																'a-al': [
																	{
																		n: 'selectionmode',
																		'o-vl': {
																			v: '0',
																		},
																	},
																	{
																		n: 'portmode',
																		'o-vl': {
																			v: '0',
																		},
																	},
																	{
																		n: 'clipchildren',
																		'o-vl': {
																			v: 'true',
																			t: 'b',
																		},
																	},
																	{
																		n: 'container',
																		'o-vl': {
																			v: 'false',
																			t: 'b',
																		},
																	},
																],
															},
															{
																n: 'Worksheet',
																cl: 'JSG.WorksheetAttributes',
																'a-al': [
																	{
																		n: 'calcondemand',
																		'o-vl': {
																			v: 'true',
																			t: 'b',
																		},
																	},
																],
															},
														],
													},
													'o-name': {
														v: 'P1',
														t: 's',
													},
													'o-pin': {
														'o-p': {
															'o-x': {
																v: '0',
															},
															'o-y': {
																v: '0',
															},
														},
														'o-lp': {
															'o-x': {
																f: 'WIDTH%20*%200.5',
																v: '0',
															},
															'o-y': {
																f: 'HEIGHT%20*%200.5',
																v: '0',
															},
														},
													},
													'o-size': {
														'o-w': {
															v: '0',
														},
														'o-h': {
															v: '0',
														},
													},
													'o-shape': {
														type: 'rectangle',
													},
													'o-scrollposition': {
														x: '0',
														y: '0',
													},
													'o-scrollmode': {
														h: '0',
														v: '0',
													},
													'a-graphitem': [
														{
															id: '1026',
															parentid: '1025',
															'o-al': {
																n: 'model.attributes',
																'a-al': [
																	{
																		n: 'graphitem',
																		cl: 'JSG.graph.attr.ItemAttributes',
																		'a-al': [
																			{
																				n: 'selectionmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'portmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'container',
																				'o-vl': {
																					v: 'false',
																					t: 'b',
																				},
																			},
																		],
																	},
																],
															},
															'o-name': {
																v: 'Cells179740484459',
																t: 's',
															},
															'o-pin': {
																'o-p': {
																	'o-x': {
																		v: '0',
																	},
																	'o-y': {
																		v: '0',
																	},
																},
																'o-lp': {
																	'o-x': {
																		f: 'WIDTH%20*%200.5',
																		v: '0',
																	},
																	'o-y': {
																		f: 'HEIGHT%20*%200.5',
																		v: '0',
																	},
																},
															},
															'o-size': {
																'o-w': {
																	v: '0',
																},
																'o-h': {
																	v: '0',
																},
															},
															'o-shape': {
																type: 'rectangle',
															},
															type: 'cellsnode',
															datatype: 'Data',
															'o-data': {},
														},
														{
															id: '1027',
															parentid: '1025',
															'o-al': {
																n: 'model.attributes',
																'a-al': [
																	{
																		n: 'format',
																		cl: 'JSG.graph.attr.FormatAttributes',
																		'a-al': [
																			{
																				n: 'linecolor',
																				'o-vl': {
																					v: '%23AAAAAA',
																					t: 's',
																				},
																			},
																		],
																	},
																	{
																		n: 'graphitem',
																		cl: 'JSG.graph.attr.ItemAttributes',
																		'a-al': [
																			{
																				n: 'selectionmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'portmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'container',
																				'o-vl': {
																					v: 'false',
																					t: 'b',
																				},
																			},
																		],
																	},
																	{
																		n: 'WorksheetHeader',
																		cl: 'JSG.HeaderAttributes',
																		'a-al': [
																			{
																				n: 'initialsection',
																				'o-vl': {
																					v: '-1',
																				},
																			},
																		],
																	},
																	{
																		n: 'textformat',
																		cl: 'JSG.graph.attr.TextFormatAttributes',
																		'a-al': [
																			{
																				n: 'fontsize',
																				'o-vl': {
																					v: '9',
																				},
																			},
																		],
																	},
																],
															},
															'o-name': {
																v: 'ColumnHeader497151540',
																t: 's',
															},
															'o-pin': {
																'o-p': {
																	'o-x': {
																		v: '0',
																	},
																	'o-y': {
																		v: '0',
																	},
																},
																'o-lp': {
																	'o-x': {
																		f: 'WIDTH%20*%200.5',
																		v: '0',
																	},
																	'o-y': {
																		f: 'HEIGHT%20*%200.5',
																		v: '0',
																	},
																},
															},
															'o-size': {
																'o-w': {
																	v: '0',
																},
																'o-h': {
																	v: '0',
																},
															},
															'o-shape': {
																type: 'rectangle',
															},
															type: 'columnheadernode',
															'o-sections': {
																'a-section': [
																	{
																		index: '0',
																		title: 'IF',
																		size: '700',
																	},
																],
															},
														},
														{
															id: '1028',
															parentid: '1025',
															'o-al': {
																n: 'model.attributes',
																'a-al': [
																	{
																		n: 'format',
																		cl: 'JSG.graph.attr.FormatAttributes',
																		'a-al': [
																			{
																				n: 'linecolor',
																				'o-vl': {
																					v: '%23AAAAAA',
																					t: 's',
																				},
																			},
																		],
																	},
																	{
																		n: 'graphitem',
																		cl: 'JSG.graph.attr.ItemAttributes',
																		'a-al': [
																			{
																				n: 'selectionmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'portmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'container',
																				'o-vl': {
																					v: 'false',
																					t: 'b',
																				},
																			},
																		],
																	},
																	{
																		n: 'WorksheetHeader',
																		cl: 'JSG.HeaderAttributes',
																		'a-al': [
																			{
																				n: 'defaultsectionsize',
																				'o-vl': {
																					v: '500',
																				},
																			},
																		],
																	},
																	{
																		n: 'textformat',
																		cl: 'JSG.graph.attr.TextFormatAttributes',
																		'a-al': [
																			{
																				n: 'fontsize',
																				'o-vl': {
																					v: '9',
																				},
																			},
																		],
																	},
																],
															},
															'o-name': {
																v: 'RowHeader491717511155',
																t: 's',
															},
															'o-pin': {
																'o-p': {
																	'o-x': {
																		v: '0',
																	},
																	'o-y': {
																		v: '0',
																	},
																},
																'o-lp': {
																	'o-x': {
																		f: 'WIDTH%20*%200.5',
																		v: '0',
																	},
																	'o-y': {
																		f: 'HEIGHT%20*%200.5',
																		v: '0',
																	},
																},
															},
															'o-size': {
																'o-w': {
																	v: '0',
																},
																'o-h': {
																	v: '0',
																},
															},
															'o-shape': {
																type: 'rectangle',
															},
															type: 'rowheadernode',
															'o-sections': {},
														},
														{
															id: '1029',
															parentid: '1025',
															'o-al': {
																n: 'model.attributes',
																'a-al': [
																	{
																		n: 'format',
																		cl: 'JSG.graph.attr.FormatAttributes',
																		'a-al': [
																			{
																				n: 'linecolor',
																				'o-vl': {
																					v: '%23AAAAAA',
																					t: 's',
																				},
																			},
																		],
																	},
																	{
																		n: 'graphitem',
																		cl: 'JSG.graph.attr.ItemAttributes',
																		'a-al': [
																			{
																				n: 'selectionmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'portmode',
																				'o-vl': {
																					v: '0',
																				},
																			},
																			{
																				n: 'container',
																				'o-vl': {
																					v: 'false',
																					t: 'b',
																				},
																			},
																		],
																	},
																],
															},
															'o-name': {
																v: 'SheetHeader418515159057',
																t: 's',
															},
															'o-pin': {
																'o-p': {
																	'o-x': {
																		v: '0',
																	},
																	'o-y': {
																		v: '0',
																	},
																},
																'o-lp': {
																	'o-x': {
																		f: 'WIDTH%20*%200.5',
																		v: '0',
																	},
																	'o-y': {
																		f: 'HEIGHT%20*%200.5',
																		v: '0',
																	},
																},
															},
															'o-size': {
																'o-w': {
																	v: '0',
																},
																'o-h': {
																	v: '0',
																},
															},
															'o-shape': {
																type: 'rectangle',
															},
															type: 'sheetheadernode',
														},
													],
													type: 'processsheet',
												},
											],
											type: 'processsheetcontainer',
										},
									],
									type: 'processcontainer',
								},
								{
									id: '38131594195',
									parentid: '545181910840',
									'o-al': {
										n: 'model.attributes',
										'a-al': [
											{
												n: 'format',
												cl: 'JSG.graph.attr.FormatAttributes',
												'a-al': [
													{
														n: 'fillcolor',
														'o-vl': {
															v: '%23CFD8DC',
															t: 's',
														},
													},
													{
														n: 'linecolor',
														'o-vl': {
															v: '%23AAAAAA',
															t: 's',
														},
													},
												],
											},
											{
												n: 'graphitem',
												cl: 'JSG.graph.attr.ItemAttributes',
												'a-al': [
													{
														n: 'portmode',
														'o-vl': {
															v: '0',
														},
													},
													{
														n: 'container',
														'o-vl': {
															v: 'false',
															t: 'b',
														},
													},
												],
											},
										],
									},
									'o-name': {
										v: 'Splitter38131594195',
										t: 's',
									},
									'o-pin': {
										'o-p': {
											'o-x': {
												v: '0',
											},
											'o-y': {
												v: '0',
											},
										},
										'o-lp': {
											'o-x': {
												f: 'WIDTH%20*%200.5',
												v: '25',
											},
											'o-y': {
												f: 'HEIGHT%20*%200.5',
												v: '88',
											},
										},
									},
									'o-size': {
										'o-w': {
											v: '50',
										},
										'o-h': {
											v: '175',
										},
									},
									'o-shape': {
										type: 'rectangle',
									},
									type: 'splitternode',
									direction: '1',
								},
								{
									id: '415585193431',
									parentid: '545181910840',
									'o-al': {
										n: 'model.attributes',
										'a-al': [
											{
												n: 'format',
												cl: 'JSG.graph.attr.FormatAttributes',
												'a-al': [
													{
														n: 'linecolor',
														'o-vl': {
															v: '%23AAAAAA',
															t: 's',
														},
													},
												],
											},
											{
												n: 'graphitem',
												cl: 'JSG.graph.attr.ItemAttributes',
												'a-al': [
													{
														n: 'portmode',
														'o-vl': {
															v: '0',
														},
													},
													{
														n: 'rotatable',
														'o-vl': {
															v: 'false',
															t: 'b',
														},
													},
													{
														n: 'container',
														'o-vl': {
															v: 'false',
															t: 'b',
														},
													},
													{
														n: 'selectionmode',
														'o-vl': {
															v: '0',
														},
													},
												],
											},
										],
									},
									'o-name': {
										v: 'OutboxContainer415585193431',
										t: 's',
									},
									'o-pin': {
										'o-p': {
											'o-x': {
												v: '0',
											},
											'o-y': {
												v: '0',
											},
										},
										'o-lp': {
											'o-x': {
												f: 'WIDTH%20*%200.5',
												v: '2500',
											},
											'o-y': {
												f: 'HEIGHT%20*%200.5',
												v: '25',
											},
										},
									},
									'o-size': {
										'o-w': {
											v: '5000',
										},
										'o-h': {
											v: '50',
										},
									},
									type: 'outboxcontainer',
								},
							],
							type: 'machinecontainer',
						},
					],
				},
				machineId: 'HyZdL8cQz',
			},
		},
		user: {
			id: 'user1',
		},
	},
	subscribeResponse: {
		type: 'response',
		requestId: 'ab3fa430-f089-11e7-903c-37f84382dbe2',
		requestType: 'machine_subscribe',
		machineserver: {
			machine: {
				id: 'HyZdL8cQz',
				name: 'Machine330',
				mode: 'uncontrolled',
				state: 'stopped',
				stats: {
					steps: 0,
				},
				subscribed: true,
				outbox: {
					messages: [],
				},
				streamsheets: [
					{
						id: 'rkWZuLLqmz',
						name: 'P1',
						loop: {
							path: '',
							enabled: true,
						},
						inbox: {
							max: 100,
							type: 'Inbox',
							id: 'SyzZOLL9XG',
						},
						sheet: {
							cells: {},
						},
						trigger: {
							type: 'arrival',
							repeat: 'once',
						},
						messages: [],
						jsonpath: '[0]',
						stats: {
							messages: 0,
							steps: 0,
						},
					},
				],
			},
		},
		graphserver: {
			graph: {
				id: 'B1W_8L9mG',
				subscribed: true,
			},
		},
		user: {
			id: 'user1',
		},
	},
};
