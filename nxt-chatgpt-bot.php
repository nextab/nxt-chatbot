<?php
/**
 * Plugin Name: OpenAI Assistant Integration
 * Description: Bindet den OpenAI Assistant per REST-Route und Shortcode in WordPress ein.
 * Version: 1.0.0
 * Author: nexTab | OpenAI
 */

if ( ! defined('ABSPATH') ) {
	exit;
}

class NXT_ChatGPT_Bot {
	private static $instance = null;
	private $plugin_path;
	private $plugin_url;

	private function __construct() {
		$this->plugin_path = plugin_dir_path(__FILE__);
		$this->plugin_url = plugin_dir_url(__FILE__);
		
		load_plugin_textdomain('nxt-chatgpt-bot', false, dirname(plugin_basename(__FILE__)) . '/languages');
		
		add_action('init', [$this, 'register_block']);
		add_action('enqueue_block_editor_assets', [$this, 'register_editor_assets']);
		add_action('rest_api_init', [$this, 'register_rest_route']);
		add_shortcode('openai_chat', [$this, 'render_chat_interface']);
	}

	public static function get_instance() {
		if (self::$instance === null) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function register_block() {
		register_block_type('nxt-chatgpt-bot/chat', [
			'render_callback' => [$this, 'render_chat_interface'],
			'attributes' => [
				'maxWidth' => [
					'type' => 'number',
					'default' => 800
				],
				'backgroundColor' => [
					'type' => 'string',
					'default' => '#f0f0f0'
				],
				'textColor' => [
					'type' => 'string',
					'default' => '#000000'
				],
				'buttonColor' => [
					'type' => 'string',
					'default' => '#007bff'
				],
				'buttonTextColor' => [
					'type' => 'string',
					'default' => '#ffffff'
				],
				'chatHeight' => [
					'type' => 'string',
					'default' => 'auto'
				],
				'customPrompt' => [
					'type' => 'string',
					'default' => ''
				],
				'useResponseFormat' => [
					'type' => 'boolean',
					'default' => true
				],
				'useResponseOptions' => [
					'type' => 'boolean',
					'default' => true
				],
				'buttonBorderRadius' => [
					'type' => 'string',
					'default' => '4px'
				],
				'buttonPadding' => [
					'type' => 'string',
					'default' => '10px 20px'
				],
				'userBubbleColor' => [
					'type' => 'string',
					'default' => '#007bff'
				],
				'botBubbleColor' => [
					'type' => 'string',
					'default' => '#f0f0f0'
				],
				'userBubbleTextColor' => [
					'type' => 'string',
					'default' => '#ffffff'
				],
				'botBubbleTextColor' => [
					'type' => 'string',
					'default' => '#000000'
				],
				'bubbleBorderRadius' => [
					'type' => 'string',
					'default' => '4px'
				],
				'suggestionBgColor' => [
					'type' => 'string',
					'default' => '#f0f0f0'
				],
				'suggestionTextColor' => [
					'type' => 'string',
					'default' => '#000000'
				],
				'suggestionPadding' => [
					'type' => 'string',
					'default' => '8px 20px'
				],
				'suggestionRadius' => [
					'type' => 'string',
					'default' => '20px'
				],
				'showBorders' => [
					'type' => 'boolean',
					'default' => true
				],
				'borderWidth' => [
					'type' => 'string',
					'default' => '1px'
				],
				'borderColor' => [
					'type' => 'string',
					'default' => '#ddd'
				],
				'showQuickBtnBorders' => [
					'type' => 'boolean',
					'default' => true
				],
				'quickBtnBorderWidth' => [
					'type' => 'string',
					'default' => '1px'
				],
				'quickBtnBorderColor' => [
					'type' => 'string',
					'default' => '#ddd'
				],
				'submitButtonPosition' => [
					'type' => 'string',
					'default' => 'inline'
				],
				'submitButtonAlign' => [
					'type' => 'string',
					'default' => 'right'
				],
				'buttonHoverBg' => [
					'type' => 'string',
					'default' => '#0056b3'
				],
				'buttonHoverText' => [
					'type' => 'string',
					'default' => '#ffffff'
				],
				'quickBtnHoverBg' => [
					'type' => 'string',
					'default' => '#e0e0e0'
				],
				'quickBtnHoverText' => [
					'type' => 'string',
					'default' => '#000000'
				],
				'spinnerColor' => [
					'type' => 'string',
					'default' => '#007bff'
				],
				'useTextarea' => [
					'type' => 'boolean',
					'default' => false
				],
				'quickBtnBgColor' => [
					'type' => 'string',
					'default' => '#f0f0f0'
				],
				'quickBtnTextColor' => [
					'type' => 'string',
					'default' => '#000000'
				],
				'quickBtnPadding' => [
					'type' => 'string',
					'default' => '8px 20px'
				],
				'quickBtnRadius' => [
					'type' => 'string',
					'default' => '20px'
				],
				'showMicButton' => [
					'type' => 'boolean',
					'default' => true
				],
				'bubblesFontFamily' => [
					'type' => 'string',
					'default' => ''
				],
				'buttonsFontFamily' => [
					'type' => 'string',
					'default' => ''
				]
			]
		]);
	}

	private function get_system_prompt($attrs) {
		$prompt = $attrs['customPrompt'] ?: __('Du bist ein Trainer zur Prüfungs-Vorbereitung für angehende Heilpraktiker. Deine Aufgabe ist es, realistische medizinische Fallszenarien zu präsentieren und direkt auf die Aktionen des Nutzers zu reagieren.', 'nxt-chatgpt-bot');

		if ($attrs['useResponseFormat']) {
			$prompt .= __('ANTWORTFORMAT:', 'nxt-chatgpt-bot') . "\n";
			$prompt .= __('Hauptantwort in HTML:', 'nxt-chatgpt-bot') . "\n";
			$prompt .= "- <p> für Absätze\n";
			$prompt .= "- <strong> für Hervorhebungen\n";
			$prompt .= "- <ul>/<li> für Listen\n";
			$prompt .= "- <br> für Zeilenumbrüche\n\n";
		}

		if ($attrs['useResponseOptions']) {
			$prompt .= __('Am Ende jeder Antwort füge Optionen hinzu:', 'nxt-chatgpt-bot') . "\n";
			$prompt .= "<response-options>\n";
			$prompt .= "    <option>Option 1</option>\n";
			$prompt .= "    <option>Option 2</option>\n";
			$prompt .= "    <option>Option 3</option>\n";
			$prompt .= "</response-options>\n";
		}

		return $prompt;
	}

	public function register_editor_assets() {
		// Register block script
		wp_enqueue_script(
			'nxt-chatbot-block',
			$this->plugin_url . 'blocks/chat/nxt-chatbot-block.js',
			[
				'wp-blocks',
				'wp-element',
				'wp-editor',
				'wp-components',
				'wp-block-editor',
				'wp-server-side-render'
			]
		);

		// Register block styles
		wp_enqueue_style(
			'nxt-chatbot-editor',
			$this->plugin_url . 'blocks/chat/css/nxt-chatbot-editor.css'
		);
	}

	public function register_rest_route() {
		register_rest_route('openai/v1', '/chat', [
			'methods' => 'POST',
			'callback' => [$this, 'handle_chat_request'],
			'permission_callback' => function() {
				return current_user_can('read');
			}
		]);

		register_rest_route('openai/v1', '/transcribe', [
			'methods' => 'POST',
			'callback' => [$this, 'handle_transcription'],
			'permission_callback' => function() {
				return current_user_can('read');
			}
		]);
	}

	public function verify_nonce(\WP_REST_Request $request) {
		$nonce = $request->get_header('X-WP-Nonce');
		if (!$nonce) {
			return false;
		}
		return wp_verify_nonce($nonce, 'wp_rest');
	}

	public function handle_chat_request(\WP_REST_Request $request) {
		$message_history = $request->get_param('history');
		$block_attrs = $request->get_param('blockAttributes');
		
		if (!is_array($message_history)) {
			return new \WP_Error('invalid_history', __('Invalid message history format', 'nxt-chatgpt-bot'));
		}

		$system_prompt = $this->get_system_prompt($block_attrs);
		$api_key = OPENAI_API_KEY;
		$api_url = 'https://api.openai.com/v1/chat/completions';

		$body = [
			'model' => 'gpt-4o-mini',
			'messages' => $message_history,
			'temperature' => 0.7,
			'max_tokens' => 1000
		];

		$response = wp_remote_post($api_url, [
			'headers' => [
				'Content-Type' => 'application/json',
				'Authorization' => 'Bearer ' . $api_key
			],
			'body' => json_encode($body),
			'timeout' => 60
		]);

		if (is_wp_error($response)) {
			return new \WP_Error('api_error', $response->get_error_message());
		}

		$response_code = wp_remote_retrieve_response_code($response);
		if ($response_code !== 200) {
			$body = wp_remote_retrieve_body($response);
			$error_data = json_decode($body, true);
			return new \WP_Error(
				'api_error',
				'OpenAI API Error: ' . ($error_data['error']['message'] ?? 'Unknown error'),
				['status' => $response_code]
			);
		}

		$parsed_body = json_decode(wp_remote_retrieve_body($response), true);
		
		if (!isset($parsed_body['choices'][0]['message']['content'])) {
			return new \WP_Error('parse_error', 'Invalid API response structure', [
				'response' => $parsed_body
			]);
		}

		$assistant_text = $parsed_body['choices'][0]['message']['content'];
		return ['response' => $assistant_text];
	}

	public function handle_transcription($request) {
		if (!isset($_FILES['audio'])) {
			return new WP_Error('missing_audio', 'No audio file provided', ['status' => 400]);
		}

		// Try to get API key from constant first, then fallback to option
		$api_key = defined('OPENAI_API_KEY') ? OPENAI_API_KEY : get_option('nxt_chatgpt_bot_api_key');
		
		if (!$api_key) {
			return new WP_Error('missing_api_key', 'OpenAI API key not configured', ['status' => 500]);
		}

		$file_path = $_FILES['audio']['tmp_name'];
		$file_type = $_FILES['audio']['type'];

		// Send to OpenAI's Whisper API
		$ch = curl_init('https://api.openai.com/v1/audio/transcriptions');
		$post_data = [
			'file' => new CURLFile($file_path, $file_type, 'audio.webm'),
			'model' => 'whisper-1',
			'language' => 'de'
		];

		curl_setopt_array($ch, [
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_HTTPHEADER => [
				'Authorization: Bearer ' . $api_key
			],
			CURLOPT_POSTFIELDS => $post_data
		]);

		$response = curl_exec($ch);
		$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		
		// Add error logging
		if ($http_code !== 200) {
			error_log('OpenAI Whisper API Error: ' . curl_error($ch) . ' Response: ' . $response);
		}
		
		curl_close($ch);

		if ($http_code !== 200) {
			return new WP_Error(
				'transcription_failed',
				'Failed to transcribe audio: ' . $response,
				['status' => $http_code]
			);
		}

		$result = json_decode($response, true);
		if (!isset($result['text'])) {
			return new WP_Error(
				'invalid_response',
				'Invalid response from OpenAI',
				['status' => 500]
			);
		}

		return [
			'success' => true,
			'transcription' => $result['text']
		];
	}

	public function render_chat_interface($attrs = []) {
		$defaults = [
			'maxWidth' => 800,
			'backgroundColor' => '#f0f0f0',
			'textColor' => '#000000',
			'buttonColor' => '#007bff',
			'buttonTextColor' => '#ffffff',
			'chatHeight' => 'auto',
			'suggestionBgColor' => '#f0f0f0',
			'suggestionTextColor' => '#000000',
			'buttonBorderRadius' => '4px',
			'buttonPadding' => '10px 20px',
			'showBorders' => true,
			'borderWidth' => '1px',
			'borderColor' => '#ddd',
			'showQuickBtnBorders' => true,
			'quickBtnBorderWidth' => '1px',
			'quickBtnBorderColor' => '#ddd',
			'submitButtonPosition' => 'inline',
			'submitButtonAlign' => 'right',
			'buttonHoverBg' => '#0056b3',
			'buttonHoverText' => '#ffffff',
			'quickBtnHoverBg' => '#e0e0e0',
			'quickBtnHoverText' => '#000000',
			'spinnerColor' => '#007bff',
			'useTextarea' => false,
			'quickBtnBgColor' => '#f0f0f0',
			'quickBtnTextColor' => '#000000',
			'quickBtnPadding' => '8px 20px',
			'quickBtnRadius' => '20px',
			'userBubbleColor' => '#007bff',
			'botBubbleColor' => '#f0f0f0',
			'userBubbleTextColor' => '#ffffff',
			'botBubbleTextColor' => '#000000',
			'bubbleBorderRadius' => '4px',
			'showMicButton' => true,
			'bubblesFontFamily' => '',
			'buttonsFontFamily' => ''
		];

		$attrs = wp_parse_args($attrs, $defaults);

		// Enqueue frontend assets
		wp_enqueue_style(
			'nxt-chatbot-styles',
			$this->plugin_url . 'assets/css/nxt-chatbot-styles.css',
			[],
			'1.0.0'
		);

		wp_enqueue_script(
			'nxt-chatbot-script',
			$this->plugin_url . 'assets/js/nxt-chatbot-script.js',
			['wp-api'],
			'1.0.0',
			true
		);

		// Pass data to frontend script
		wp_localize_script('nxt-chatbot-script', 'nxtChatbot', [
			'apiUrl' => esc_url(rest_url('openai/v1')),
			'nonce' => wp_create_nonce('wp_rest'),
			'systemPrompt' => $this->get_system_prompt($attrs)
		]);

		// Generate inline styles as a string
		$container_style = sprintf(
			'--nxt-chatbot-max-width: %dpx; ' .
			'--nxt-chatbot-custom-bg: %s; ' .
			'--nxt-chatbot-custom-text: %s; ' .
			'--nxt-chatbot-custom-btn-bg: %s; ' .
			'--nxt-chatbot-custom-btn-text: %s; ' .
			'--nxt-chatbot-chat-height: %s; ' .
			'--nxt-chatbot-button-radius: %s; ' .
			'--nxt-chatbot-button-padding: %s; ' .
			'--nxt-chatbot-send-btn-border: %s; ' .
			'--nxt-chatbot-quick-btn-border: %s; ' .
			'--nxt-chatbot-submit-btn-position: %s; ' .
			'--nxt-chatbot-submit-btn-align: %s; ' .
			'--nxt-chatbot-quick-btn-bg: %s; ' .
			'--nxt-chatbot-quick-btn-text: %s; ' .
			'--nxt-chatbot-button-hover-bg: %s; ' .
			'--nxt-chatbot-button-hover-text: %s; ' .
			'--nxt-chatbot-quick-btn-hover-bg: %s; ' .
			'--nxt-chatbot-quick-btn-hover-text: %s; ' .
			'--nxt-chatbot-spinner-color: %s; ' .
			'background-color: %s; ' .
			'color: %s; ' .
			'max-width: %dpx; ' .
			'height: %s; ' .
			'--nxt-chatbot-quick-btn-padding: %s; ' .
			'--nxt-chatbot-quick-btn-radius: %s; ' .
			'--nxt-chatbot-user-bubble-bg: %s; ' .
			'--nxt-chatbot-bot-bubble-bg: %s; ' .
			'--nxt-chatbot-user-bubble-text: %s; ' .
			'--nxt-chatbot-bot-bubble-text: %s; ' .
			'--nxt-chatbot-bubble-radius: %s; ' .
			'--nxt-chatbot-bubbles-font: %s; ' .
			'--nxt-chatbot-buttons-font: %s;',
			esc_attr($attrs['maxWidth']),
			esc_attr($attrs['backgroundColor']),
			esc_attr($attrs['textColor']),
			esc_attr($attrs['buttonColor']),
			esc_attr($attrs['buttonTextColor']),
			esc_attr($attrs['chatHeight']),
			esc_attr($attrs['buttonBorderRadius']),
			esc_attr($attrs['buttonPadding']),
			$attrs['showBorders'] ? esc_attr($attrs['borderWidth'] . ' solid ' . $attrs['borderColor']) : 'none',
			$attrs['showQuickBtnBorders'] ? esc_attr($attrs['quickBtnBorderWidth'] . ' solid ' . $attrs['quickBtnBorderColor']) : 'none',
			$attrs['submitButtonPosition'] === 'below' ? 'column' : 'row',
			$attrs['submitButtonPosition'] === 'below' ? 
				($attrs['submitButtonAlign'] === 'right' ? 'flex-end' : 'flex-start') : 'center',
			esc_attr($attrs['quickBtnBgColor']),
			esc_attr($attrs['quickBtnTextColor']),
			esc_attr($attrs['buttonHoverBg']),
			esc_attr($attrs['buttonHoverText']),
			esc_attr($attrs['quickBtnHoverBg']),
			esc_attr($attrs['quickBtnHoverText']),
			esc_attr($attrs['spinnerColor']),
			esc_attr($attrs['backgroundColor']),
			esc_attr($attrs['textColor']),
			esc_attr($attrs['maxWidth']),
			esc_attr($attrs['chatHeight']),
			esc_attr($attrs['quickBtnPadding']),
			esc_attr($attrs['quickBtnRadius']),
			esc_attr($attrs['userBubbleColor']),
			esc_attr($attrs['botBubbleColor']),
			esc_attr($attrs['userBubbleTextColor']),
			esc_attr($attrs['botBubbleTextColor']),
			esc_attr($attrs['bubbleBorderRadius']),
			esc_attr($attrs['bubblesFontFamily'] ?: 'var(--wp--preset--font-family--system-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif)'),
			esc_attr($attrs['buttonsFontFamily'] ?: 'var(--wp--preset--font-family--system-font, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif)')
		);

		// Update the input container HTML to include mic button visibility class
		$mic_visibility_class = $attrs['showMicButton'] ? '' : ' nxt-chatbot__mic-btn--hidden';

		ob_start();
		?>
		<div class="nxt-chatbot__container" style="<?php echo esc_attr($container_style); ?>">
			<div class="nxt-chatbot__history"></div>
			<div class="nxt-chatbot__controls">
				<div class="nxt-chatbot__quick-responses">
					<button class="nxt-chatbot__quick-btn" data-response="Ich möchte einen neuen Fall beginnen">
						Neuer Fall
					</button>
				</div>
				<div class="nxt-chatbot__input-container">
					<label for="nxtChatbotInput" class="nxt-chatbot__visually-hidden">
						Stell deine Frage...
					</label>
					<?php if ($attrs['useTextarea']) : ?>
						<textarea 
							id="nxtChatbotInput"
							class="nxt-chatbot__input nxt-chatbot__input--textarea"
							placeholder="Stell deine Frage..."
							rows="3"
						></textarea>
					<?php else : ?>
						<input 
							type="text" 
							id="nxtChatbotInput" 
							class="nxt-chatbot__input" 
							placeholder="Stell deine Frage..." 
						/>
					<?php endif; ?>
					<div class="nxt-chatbot__button-group">
						<button class="nxt-chatbot__mic-btn<?php echo esc_attr($mic_visibility_class); ?>" title="Sprachnachricht aufnehmen">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
								<path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
								<line x1="12" y1="19" x2="12" y2="23"/>
								<line x1="8" y1="23" x2="16" y2="23"/>
							</svg>
						</button>
						<button class="nxt-chatbot__send-btn">Senden</button>
					</div>
				</div>
			</div>
		</div>
		<?php
		return ob_get_clean();
	}
}

// Initialize the plugin
add_action('plugins_loaded', function() {
	NXT_ChatGPT_Bot::get_instance();
});