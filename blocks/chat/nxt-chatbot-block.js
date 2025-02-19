(function(wp) {
	const { registerBlockType } = wp.blocks;
	const { createElement: el } = wp.element;
	const { 
		InspectorControls,
		useBlockProps,
		BlockControls 
	} = wp.blockEditor;
	const { 
		PanelBody,
		TextControl,
		ColorPicker,
		SelectControl,
		ToggleControl,
		TextareaControl
	} = wp.components;
	const { __ } = wp.i18n;
	const { dispatch, select } = wp.data;

	// Helper function to focus a specific control
	const focusControl = (controlId) => {
		// Open the block sidebar
		dispatch('core/edit-post').openGeneralSidebar('edit-post/block');
		
		// Wait for the DOM to update
		setTimeout(() => {
			const element = document.querySelector(controlId);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth', block: 'center' });
				// Add a brief highlight effect
				element.style.transition = 'background-color 0.3s';
				element.style.backgroundColor = '#f0f6fc';
				setTimeout(() => {
					element.style.backgroundColor = '';
				}, 1000);
			}
		}, 150);
	};

	registerBlockType('nxt-chatgpt-bot/chat', {
		title: __('OpenAI Chat', 'nxt-chatgpt-bot'),
		icon: 'format-chat',
		category: 'widgets',
		attributes: {
			maxWidth: {
				type: 'number',
				default: 800
			},
			backgroundColor: {
				type: 'string',
				default: '#f0f0f0'
			},
			textColor: {
				type: 'string',
				default: '#000000'
			},
			buttonColor: {
				type: 'string',
				default: '#007bff'
			},
			buttonTextColor: {
				type: 'string',
				default: '#ffffff'
			},
			chatHeight: {
				type: 'string',
				default: 'auto'
			},
			customPrompt: {
				type: 'string',
				default: ''
			},
			useResponseFormat: {
				type: 'boolean',
				default: true
			},
			useResponseOptions: {
				type: 'boolean',
				default: true
			},
			buttonBorderRadius: {
				type: 'string',
				default: '4px'
			},
			buttonPadding: {
				type: 'string',
				default: '10px 20px'
			},
			userBubbleColor: {
				type: 'string',
				default: '#007bff'
			},
			botBubbleColor: {
				type: 'string',
				default: '#f0f0f0'
			},
			bubbleBorderRadius: {
				type: 'string',
				default: '4px'
			},
			suggestionBgColor: {
				type: 'string',
				default: '#f0f0f0'
			},
			suggestionPadding: {
				type: 'string',
				default: '8px 20px'
			},
			suggestionRadius: {
				type: 'string',
				default: '20px'
			},
			useTextarea: {
				type: 'boolean',
				default: false
			},
			userBubbleTextColor: {
				type: 'string',
				default: '#ffffff'
			},
			botBubbleTextColor: {
				type: 'string',
				default: '#000000'
			},
			submitButtonPosition: {
				type: 'string',
				default: 'inline' // 'inline', 'below'
			},
			submitButtonAlign: {
				type: 'string',
				default: 'right' // 'left', 'right'
			},
			// Border controls
			showBorders: {
				type: 'boolean',
				default: true
			},
			borderWidth: {
				type: 'string',
				default: '1px'
			},
			borderColor: {
				type: 'string',
				default: '#ddd'
			},
			// Quick response button borders
			showQuickBtnBorders: {
				type: 'boolean',
				default: true
			},
			quickBtnBorderWidth: {
				type: 'string',
				default: '1px'
			},
			quickBtnBorderColor: {
				type: 'string',
				default: '#ddd'
			},
			buttonHoverBg: {
				type: 'string',
				default: '#0056b3'  // Darker blue
			},
			buttonHoverText: {
				type: 'string',
				default: '#ffffff'
			},
			quickBtnHoverBg: {
				type: 'string',
				default: '#e0e0e0'
			},
			quickBtnHoverText: {
				type: 'string',
				default: '#000000'
			},
			spinnerColor: {
				type: 'string',
				default: '#007bff'  // Match default primary color
			},
			quickBtnBgColor: {
				type: 'string',
				default: '#f0f0f0'
			},
			quickBtnTextColor: {
				type: 'string',
				default: '#000000'
			},
			quickBtnPadding: {
				type: 'string',
				default: '8px 20px'
			},
			quickBtnRadius: {
				type: 'string',
				default: '20px'
			},
			showMicButton: {
				type: 'boolean',
				default: true
			},
			bubblesFontFamily: {
				type: 'string',
				default: ''
			},
			buttonsFontFamily: {
				type: 'string',
				default: ''
			}
		},

		edit: function(props) {
			const { attributes, setAttributes } = props;
			const { select } = wp.data;
			
			// Get available font families from WordPress with proper fallback
			const settings = select('core/block-editor').getSettings();
			const themeFontFamilies = Array.isArray(settings?.__experimentalFeatures?.typography?.fontFamilies)
				? settings.__experimentalFeatures.typography.fontFamilies
				: [];

			const fontOptions = [{ label: __('Default System Font', 'nxt-chatgpt-bot'), value: '' }];
			themeFontFamilies.forEach(font => {
				if (font?.name && font?.slug) {
					fontOptions.push({
						label: font.name,
						value: `var(--wp--preset--font-family--${font.slug})`
					});
				}
			});

			const previewMessages = [
				{
					type: 'assistant',
					content: 'Hallo! Ich bin dein KI-Assistent. Wie kann ich dir heute helfen?'
				},
				{
					type: 'user',
					content: 'Ich möchte gerne einen neuen Fall besprechen.'
				},
				{
					type: 'assistant',
					content: 'Natürlich! Lass uns einen Fall durchgehen. Hier ist ein Beispiel:<br><br>' +
						'<strong>Fall:</strong> Eine 45-jährige Patientin klagt über...'
				}
			];

			// Quick response button click handler
			const handleQuickBtnClick = (e) => {
				e.preventDefault();
				focusControl('#nxt-chatbot-quick-response-styling');
			};

			// Submit button click handler
			const handleSubmitBtnClick = (e) => {
				e.preventDefault();
				focusControl('#nxt-chatbot-submit-button-styling');
			};

			// Input field click handler
			const handleInputClick = (e) => {
				e.preventDefault();
				focusControl('#nxt-chatbot-input-styling');
			};

			// Add microphone button click handler
			const handleMicBtnClick = (e) => {
				e.preventDefault();
				focusControl('#nxt-chatbot-input-styling');
			};

			// Add spinner click handler
			const handleSpinnerClick = (e) => {
				e.preventDefault();
				focusControl('#nxt-chatbot-loading-styling');
			};

			// Move styling controls to Design tab
			const styleControls = el(InspectorControls, { group: 'styles' }, [
				// General Colors & Typography
				el(PanelBody, { 
					title: __('Colors & Typography', 'nxt-chatgpt-bot'),
					initialOpen: false
				}, [
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Background Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.backgroundColor,
							onChangeComplete: value => setAttributes({ backgroundColor: value.hex })
						})
					]),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Text Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.textColor,
							onChangeComplete: value => setAttributes({ textColor: value.hex })
						})
					])
				]),

				// Quick Response Button Styling
				el(PanelBody, { 
					title: __('Quick Response Styling', 'nxt-chatgpt-bot'),
					initialOpen: false,
					id: 'nxt-chatbot-quick-response-styling'
				}, [
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Background Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.quickBtnBgColor,
							onChangeComplete: value => setAttributes({ quickBtnBgColor: value.hex })
						})
					]),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Text Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.quickBtnTextColor,
							onChangeComplete: value => setAttributes({ quickBtnTextColor: value.hex })
						})
					]),
					el(ToggleControl, {
						label: __('Show Borders', 'nxt-chatgpt-bot'),
						checked: attributes.showQuickBtnBorders,
						onChange: value => setAttributes({ showQuickBtnBorders: value })
					}),
					attributes.showQuickBtnBorders && el('div', {}, [
						el(TextControl, {
							label: __('Border Width', 'nxt-chatgpt-bot'),
							value: attributes.quickBtnBorderWidth,
							onChange: value => setAttributes({ quickBtnBorderWidth: value })
						}),
						el('div', { className: 'components-base-control' }, [
							el('label', { className: 'components-base-control__label' },
								__('Border Color', 'nxt-chatgpt-bot')
							),
							el(ColorPicker, {
								color: attributes.quickBtnBorderColor,
								onChangeComplete: value => setAttributes({ quickBtnBorderColor: value.hex })
							})
						])
					]),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Hover Background', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.quickBtnHoverBg,
							onChangeComplete: value => setAttributes({ quickBtnHoverBg: value.hex })
						})
					]),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Hover Text Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.quickBtnHoverText,
							onChangeComplete: value => setAttributes({ quickBtnHoverText: value.hex })
						})
					])
				]),

				// Submit Button Styling
				el(PanelBody, { 
					title: __('Submit Button Styling', 'nxt-chatgpt-bot'),
					initialOpen: false,
					id: 'nxt-chatbot-submit-button-styling'
				}, [
					el(SelectControl, {
						label: __('Button Position', 'nxt-chatgpt-bot'),
						value: attributes.submitButtonPosition,
						options: [
							{ label: __('Inline with Input', 'nxt-chatgpt-bot'), value: 'inline' },
							{ label: __('Below Input', 'nxt-chatgpt-bot'), value: 'below' }
						],
						onChange: value => setAttributes({ submitButtonPosition: value })
					}),
					attributes.submitButtonPosition === 'below' && el(SelectControl, {
						label: __('Button Alignment', 'nxt-chatgpt-bot'),
						value: attributes.submitButtonAlign,
						options: [
							{ label: __('Left', 'nxt-chatgpt-bot'), value: 'left' },
							{ label: __('Right', 'nxt-chatgpt-bot'), value: 'right' }
						],
						onChange: value => setAttributes({ submitButtonAlign: value })
					}),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Background Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.buttonColor,
							onChangeComplete: value => setAttributes({ buttonColor: value.hex })
						})
					]),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Text Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.buttonTextColor,
							onChangeComplete: value => setAttributes({ buttonTextColor: value.hex })
						})
					]),
					el(ToggleControl, {
						label: __('Show Border', 'nxt-chatgpt-bot'),
						checked: attributes.showBorders,
						onChange: value => setAttributes({ showBorders: value })
					}),
					attributes.showBorders && el('div', {}, [
						el(TextControl, {
							label: __('Border Width', 'nxt-chatgpt-bot'),
							value: attributes.borderWidth,
							onChange: value => setAttributes({ borderWidth: value })
						}),
						el('div', { className: 'components-base-control' }, [
							el('label', { className: 'components-base-control__label' },
								__('Border Color', 'nxt-chatgpt-bot')
							),
							el(ColorPicker, {
								color: attributes.borderColor,
								onChangeComplete: value => setAttributes({ borderColor: value.hex })
							})
						])
					]),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Hover Background', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.buttonHoverBg,
							onChangeComplete: value => setAttributes({ buttonHoverBg: value.hex })
						})
					]),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Hover Text Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.buttonHoverText,
							onChangeComplete: value => setAttributes({ buttonHoverText: value.hex })
						})
					])
				]),

				// Loading Spinner Styling
				el(PanelBody, { 
					title: __('Loading Spinner', 'nxt-chatgpt-bot'),
					initialOpen: false,
					id: 'nxt-chatbot-loading-styling'
				}, [
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Spinner Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.spinnerColor,
							onChangeComplete: value => setAttributes({ spinnerColor: value.hex })
						})
					])
				]),

				// Message Bubble Styling
				el(PanelBody, { 
					title: __('Message Bubble Styling', 'nxt-chatgpt-bot'),
					initialOpen: false,
					id: 'nxt-chatbot-bubble-styling'
				}, [
					// User Bubble Controls
					el('h3', { className: 'components-base-control__label' },
						__('User Messages', 'nxt-chatgpt-bot')
					),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Background Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.userBubbleColor,
							onChangeComplete: value => setAttributes({ userBubbleColor: value.hex })
						})
					]),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Text Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.userBubbleTextColor,
							onChangeComplete: value => setAttributes({ userBubbleTextColor: value.hex })
						})
					]),

					// Bot Bubble Controls
					el('h3', { className: 'components-base-control__label' },
						__('Bot Messages', 'nxt-chatgpt-bot')
					),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Background Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.botBubbleColor,
							onChangeComplete: value => setAttributes({ botBubbleColor: value.hex })
						})
					]),
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Text Color', 'nxt-chatgpt-bot')
						),
						el(ColorPicker, {
							color: attributes.botBubbleTextColor,
							onChangeComplete: value => setAttributes({ botBubbleTextColor: value.hex })
						})
					]),

					// Shared Bubble Settings
					el('div', { className: 'components-base-control' }, [
						el('label', { className: 'components-base-control__label' },
							__('Border Radius', 'nxt-chatgpt-bot')
						),
						el(TextControl, {
							value: attributes.bubbleBorderRadius,
							onChange: value => setAttributes({ bubbleBorderRadius: value })
						})
					]),

					// Typography
					el(PanelBody, {
						title: __('Typography', 'nxt-chatgpt-bot'),
						initialOpen: false
					}, [
						el(SelectControl, {
							label: __('Chat Bubbles Font Family', 'nxt-chatgpt-bot'),
							value: attributes.bubblesFontFamily,
							options: fontOptions,
							onChange: value => setAttributes({ bubblesFontFamily: value })
						}),
						el(SelectControl, {
							label: __('Buttons Font Family', 'nxt-chatgpt-bot'),
							value: attributes.buttonsFontFamily,
							options: fontOptions,
							onChange: value => setAttributes({ buttonsFontFamily: value })
						})
					])
				])
			]);

			// Update container style object to properly handle all dynamic styles
			const containerStyle = {
				backgroundColor: attributes.backgroundColor,
				color: attributes.textColor,
				maxWidth: attributes.maxWidth + 'px',
				height: attributes.chatHeight,
				'--nxt-chatbot-button-radius': attributes.buttonBorderRadius,
				'--nxt-chatbot-button-padding': attributes.buttonPadding,
				'--nxt-chatbot-user-bubble-bg': attributes.userBubbleColor,
				'--nxt-chatbot-bot-bubble-bg': attributes.botBubbleColor,
				'--nxt-chatbot-user-bubble-text': attributes.userBubbleTextColor,
				'--nxt-chatbot-bot-bubble-text': attributes.botBubbleTextColor,
				'--nxt-chatbot-bubble-radius': attributes.bubbleBorderRadius,
				'--nxt-chatbot-suggestion-bg': attributes.suggestionBgColor,
				'--nxt-chatbot-suggestion-padding': attributes.suggestionPadding,
				'--nxt-chatbot-suggestion-radius': attributes.suggestionRadius,
				'--nxt-chatbot-custom-btn-bg': attributes.buttonColor,
				'--nxt-chatbot-custom-btn-text': attributes.buttonTextColor,
				'--nxt-chatbot-send-btn-border': attributes.showBorders ? 
					`${attributes.borderWidth} solid ${attributes.borderColor}` : 'none',
				'--nxt-chatbot-quick-btn-border': attributes.showQuickBtnBorders ? 
					`${attributes.quickBtnBorderWidth} solid ${attributes.quickBtnBorderColor}` : 'none',
				'--nxt-chatbot-submit-btn-position': attributes.submitButtonPosition === 'below' ? 'column' : 'row',
				'--nxt-chatbot-submit-btn-align': attributes.submitButtonPosition === 'below' ? 
					(attributes.submitButtonAlign === 'right' ? 'flex-end' : 'flex-start') : 'center',
				'--nxt-chatbot-quick-btn-bg': attributes.quickBtnBgColor,
				'--nxt-chatbot-quick-btn-text': attributes.quickBtnTextColor,
				'--nxt-chatbot-quick-btn-padding': attributes.quickBtnPadding,
				'--nxt-chatbot-quick-btn-radius': attributes.quickBtnRadius,
				'--nxt-chatbot-button-hover-bg': attributes.buttonHoverBg,
				'--nxt-chatbot-button-hover-text': attributes.buttonHoverText,
				'--nxt-chatbot-quick-btn-hover-bg': attributes.quickBtnHoverBg,
				'--nxt-chatbot-quick-btn-hover-text': attributes.quickBtnHoverText,
				'--nxt-chatbot-spinner-color': attributes.spinnerColor,
				'--nxt-chatbot-bubbles-font': attributes.bubblesFontFamily,
				'--nxt-chatbot-buttons-font': attributes.buttonsFontFamily
			};

			// Add loading spinner to preview
			const previewContent = [
				el('div', { className: 'nxt-chatbot__loading-container' },
					el('div', { 
						className: 'nxt-chatbot__loading-spinner',
						onClick: handleSpinnerClick,
						title: __('Click to edit spinner styling', 'nxt-chatgpt-bot')
					})
				)
			];

			return el('div', { className: 'wp-block-nxt-chatgpt-bot-chat' },
				[
					// Main content area with prompt controls
					el('div', { className: 'nxt-chatbot-prompt-controls' },
						[
							el(TextareaControl, {
								label: __('Custom Prompt', 'nxt-chatgpt-bot'),
								help: __('Enter the base prompt for the AI assistant', 'nxt-chatgpt-bot'),
								value: attributes.customPrompt,
								onChange: function(value) {
									setAttributes({ customPrompt: value });
								},
								rows: 6
							}),
							el(ToggleControl, {
								label: __('Use HTML Response Format', 'nxt-chatgpt-bot'),
								checked: attributes.useResponseFormat,
								onChange: function(value) {
									setAttributes({ useResponseFormat: value });
								}
							}),
							el(ToggleControl, {
								label: __('Show Response Options', 'nxt-chatgpt-bot'),
								checked: attributes.useResponseOptions,
								onChange: function(value) {
									setAttributes({ useResponseOptions: value });
								}
							}),
							el(ToggleControl, {
								label: __('Show Microphone Button', 'nxt-chatgpt-bot'),
								help: __('Enable/disable voice input feature', 'nxt-chatgpt-bot'),
								checked: attributes.showMicButton,
								onChange: value => setAttributes({ showMicButton: value })
							})
						]
					),

					// Add preview area below prompt controls
					el('div', { 
						className: 'nxt-chatbot__container', 
						style: containerStyle
					},
					[
						el('div', { className: 'nxt-chatbot__history' },
							previewMessages.map((message, index) => 
								el('div', {
									className: `nxt-chatbot__message nxt-chatbot__message--${message.type}`,
									key: index,
									dangerouslySetInnerHTML: { __html: message.content }
								})
							)
						),
						el('div', { className: 'nxt-chatbot__controls' }, [
							el('div', { className: 'nxt-chatbot__quick-responses' }, [
								el('button', {
									className: 'nxt-chatbot__quick-btn',
									onClick: handleQuickBtnClick,
									title: __('Click to edit Quick Response button styling', 'nxt-chatgpt-bot')
								}, 'Neuer Fall'),
								el('button', {
									className: 'nxt-chatbot__quick-btn',
									onClick: handleQuickBtnClick,
									title: __('Click to edit Quick Response button styling', 'nxt-chatgpt-bot')
								}, 'Weitere Details')
							]),
							el('div', { className: 'nxt-chatbot__input-container' }, [
								attributes.useTextarea ?
									el('textarea', {
										className: 'nxt-chatbot__input nxt-chatbot__input--textarea',
										placeholder: 'Stell deine Frage...',
										rows: 3,
										onClick: handleInputClick,
										title: __('Click to edit input field styling', 'nxt-chatgpt-bot')
									}) :
									el('input', {
										type: 'text',
										className: 'nxt-chatbot__input',
										placeholder: 'Stell deine Frage...',
										onClick: handleInputClick,
										title: __('Click to edit input field styling', 'nxt-chatgpt-bot')
									}),
								el('div', { className: 'nxt-chatbot__button-group' }, [
									el('button', {
										className: `nxt-chatbot__mic-btn${attributes.showMicButton ? '' : ' nxt-chatbot__mic-btn--hidden'}`,
										onClick: handleMicBtnClick,
										title: __('Click to edit microphone button styling', 'nxt-chatgpt-bot')
									}, [
										el('svg', {
											xmlns: 'http://www.w3.org/2000/svg',
											viewBox: '0 0 24 24',
											fill: 'none',
											stroke: 'currentColor',
											strokeWidth: '2'
										}, [
											el('path', {
												d: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z'
											}),
											el('path', {
												d: 'M19 10v2a7 7 0 0 1-14 0v-2'
											}),
											el('line', {
												x1: '12',
												y1: '19',
												x2: '12',
												y2: '23'
											}),
											el('line', {
												x1: '8',
												y1: '23',
												x2: '16',
												y2: '23'
											})
										])
									]),
									el('button', {
										className: 'nxt-chatbot__send-btn',
										onClick: handleSubmitBtnClick,
										title: __('Click to edit Submit button styling', 'nxt-chatgpt-bot')
									}, 'Senden')
								])
							])
						])
					]),

					// Inspector Controls (Sidebar)
					styleControls
				]
			);
		},

		save: function() {
			return null;
		}
	});
})(window.wp);