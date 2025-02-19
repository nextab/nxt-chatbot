# nxt-chatbot
WordPress plugin to integrate ChatGPT on your website

# Installation
- Log in to your OpenAI account and go to API Keys: https://platform.openai.com/settings/organization/api-keys
- Set up billing on your account (or just purchase some credits to get started) on https://platform.openai.com/settings/organization/billing/overview
- Add the Open AI API key to your wp-config.php
```
if ( ! defined('OPENAI_API_KEY') ) {
	define('OPENAI_API_KEY', 'sk-proj-your-key-goes-here');
}
```

- Install the plugin and activate it
- Add a Gutenberg block and add your custom prompt to get started
