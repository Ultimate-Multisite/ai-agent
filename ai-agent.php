<?php
/**
 * Plugin Name: AI Agent for WordPress
 * Plugin URI:  https://developer.wordpress.org/
 * Description: Agentic AI loop for WordPress — chat with an AI that can call WordPress abilities (tools) autonomously.
 * Version:     0.1.0
 * Author:      Dave
 * License:     GPL-2.0-or-later
 * Requires at least: 6.9
 * Requires PHP: 7.4
 * Text Domain: ai-agent
 *
 * @package AiAgent
 */

namespace AiAgent;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AI_AGENT_DIR', __DIR__ );
define( 'AI_AGENT_URL', plugin_dir_url( __FILE__ ) );

require_once AI_AGENT_DIR . '/includes/class-agent-loop.php';
require_once AI_AGENT_DIR . '/includes/class-rest-controller.php';
require_once AI_AGENT_DIR . '/includes/class-admin-page.php';

add_action( 'rest_api_init', [ Rest_Controller::class, 'register_routes' ] );
add_action( 'admin_menu', [ Admin_Page::class, 'register' ] );
