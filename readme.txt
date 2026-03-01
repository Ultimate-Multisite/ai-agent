=== AI Agent for WordPress ===
Contributors: flavor
Tags: ai, agent, chatbot, abilities, mcp
Requires at least: 6.9
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.1.0
License: GPL-2.0-or-later

Agentic AI loop for WordPress — chat with an AI that can call WordPress abilities autonomously.

== Description ==

AI Agent provides an interactive chat interface in the WordPress admin where
an AI assistant can autonomously call WordPress abilities (tools) to help manage
your site. It uses the WordPress Abilities API (6.9+) to discover and execute
registered abilities.

Features:

* Agentic loop with tool-calling support
* Admin chat interface
* Discovers abilities from any plugin that registers them
* MCP-compatible tool execution

== Extending with Ability Plugins ==

The AI Agent discovers abilities at runtime from any plugin that registers them via
`wp_register_ability()`. The more abilities installed, the more capable the agent.

= Recommended Ability Plugins =

**WP-CLI Abilities Bridge**
Automatically discovers all WP-CLI commands and exposes them as abilities. Gives
the agent 500+ tools covering posts, users, plugins, themes, WooCommerce, and more.
Also includes system CLI tools (whois, curl, dig, bash, php, etc.).
Status: Available (bundled)

**Ultimate Multisite Core**
Registers abilities for multisite management: customers, memberships, sites, payments,
products, domains, checkout, and email accounts. Includes full MCP server support.
Status: Available — built into Ultimate Multisite 2.4+

**WooCommerce** (via WP-CLI Abilities Bridge)
WooCommerce's CLI commands are automatically exposed: products, orders, customers,
coupons, shipping, payment gateways, and more.

**WordPress Core**
WordPress 6.9+ provides the Abilities API framework. Core abilities for post CRUD,
media management, user management, and options are available via WP-CLI bridge.

**Custom Plugin Abilities**
Any plugin can register abilities via `wp_register_ability()`. See the WordPress
Abilities API documentation for details.

== Installation ==

1. Requires WordPress 6.9+ with the Abilities API
2. Activate the plugin
3. Install ability-providing plugins (e.g. WP-CLI Abilities Bridge)
4. Go to AI Agent in the admin menu to start chatting

== Changelog ==

= 0.1.0 =
* Initial release
* Agentic AI loop with tool-calling
* Admin chat interface
* Abilities API integration
