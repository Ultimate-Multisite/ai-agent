<?php
/**
 * Admin page for the AI Agent chat UI.
 *
 * @package AiAgent
 */

namespace AiAgent;

class Admin_Page {

	const SLUG = 'ai-agent';

	/**
	 * Register the admin menu page under Tools.
	 */
	public static function register(): void {
		$hook = add_management_page(
			__( 'AI Agent', 'ai-agent' ),
			__( 'AI Agent', 'ai-agent' ),
			'manage_options',
			self::SLUG,
			[ __CLASS__, 'render' ]
		);

		if ( $hook ) {
			add_action( "admin_enqueue_scripts", [ __CLASS__, 'enqueue_assets' ] );
		}
	}

	/**
	 * Enqueue assets only on our page.
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 */
	public static function enqueue_assets( string $hook_suffix ): void {
		if ( 'tools_page_' . self::SLUG !== $hook_suffix ) {
			return;
		}

		wp_enqueue_style(
			'ai-agent-chat',
			AI_AGENT_URL . 'assets/chat.css',
			[],
			'0.1.0'
		);

		wp_enqueue_script(
			'ai-agent-chat',
			AI_AGENT_URL . 'assets/chat.js',
			[],
			'0.1.0',
			true
		);

		// Build abilities list for the UI.
		$abilities = [];
		if ( function_exists( 'wp_get_abilities' ) ) {
			foreach ( wp_get_abilities() as $ability ) {
				$abilities[] = [
					'name'        => $ability->get_name(),
					'label'       => $ability->get_label(),
					'description' => $ability->get_description(),
				];
			}
		}

		wp_localize_script(
			'ai-agent-chat',
			'aiAgentData',
			[
				'restUrl'   => rest_url( Rest_Controller::NAMESPACE . '/run' ),
				'nonce'     => wp_create_nonce( 'wp_rest' ),
				'abilities' => $abilities,
			]
		);
	}

	/**
	 * Render the admin page.
	 */
	public static function render(): void {
		if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
			echo '<div class="wrap">';
			echo '<h1>' . esc_html__( 'AI Agent', 'ai-agent' ) . '</h1>';
			echo '<div class="notice notice-error"><p>';
			echo esc_html__( 'The WordPress AI Client is not available. Please install WordPress 7.0 or the AI Experiments plugin.', 'ai-agent' );
			echo '</p></div></div>';
			return;
		}

		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'AI Agent', 'ai-agent' ); ?></h1>
			<p class="description"><?php esc_html_e( 'Chat with an AI assistant that can interact with your WordPress site using registered abilities.', 'ai-agent' ); ?></p>

			<div id="ai-agent-chat">
				<div id="ai-agent-messages"></div>
				<div id="ai-agent-input-area">
					<textarea id="ai-agent-input" rows="2" placeholder="<?php esc_attr_e( 'Type a message...', 'ai-agent' ); ?>"></textarea>
					<button id="ai-agent-send" class="button button-primary"><?php esc_html_e( 'Send', 'ai-agent' ); ?></button>
				</div>
			</div>
		</div>
		<?php
	}
}
