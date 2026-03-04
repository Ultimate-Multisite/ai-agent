<?php
/**
 * Context provider registry.
 *
 * Gathers structured context from various WordPress sources for
 * injection into the agent's system prompt.
 *
 * @package AiAgent
 */

namespace AiAgent;

class Context_Providers {

	/**
	 * Registered providers: name => ['callback' => callable, 'priority' => int].
	 *
	 * @var array
	 */
	private static array $providers = [];

	/**
	 * Whether built-in providers have been registered.
	 *
	 * @var bool
	 */
	private static bool $initialized = false;

	/**
	 * Register a context provider.
	 *
	 * @param string   $name     Provider name.
	 * @param callable $callback Receives page_context array, returns array of context data.
	 * @param int      $priority Lower runs first.
	 */
	public static function register( string $name, callable $callback, int $priority = 10 ): void {
		self::$providers[ $name ] = [
			'callback' => $callback,
			'priority' => $priority,
		];
	}

	/**
	 * Gather context from all registered providers.
	 *
	 * @param array $page_context Page context from the widget JS (URL, admin page, post ID, etc.).
	 * @return array Keyed array of context sections.
	 */
	public static function gather( array $page_context = [] ): array {
		self::ensure_initialized();

		// Sort providers by priority.
		uasort( self::$providers, function ( $a, $b ) {
			return $a['priority'] <=> $b['priority'];
		} );

		$context = [];

		foreach ( self::$providers as $name => $provider ) {
			try {
				$data = call_user_func( $provider['callback'], $page_context );
				if ( ! empty( $data ) ) {
					$context[ $name ] = $data;
				}
			} catch ( \Throwable $e ) {
				// Context gathering is best-effort.
				continue;
			}
		}

		return $context;
	}

	/**
	 * Format gathered context for inclusion in a system prompt.
	 *
	 * @param array $context The gathered context data.
	 * @return string Markdown-formatted context string.
	 */
	public static function format_for_prompt( array $context ): string {
		if ( empty( $context ) ) {
			return '';
		}

		$sections = [];

		foreach ( $context as $name => $data ) {
			if ( empty( $data ) ) {
				continue;
			}

			$label = ucwords( str_replace( '_', ' ', $name ) );
			$lines = [];

			if ( is_array( $data ) ) {
				foreach ( $data as $key => $value ) {
					if ( is_array( $value ) ) {
						$value = implode( ', ', $value );
					}
					$lines[] = "- **{$key}**: {$value}";
				}
			} else {
				$lines[] = (string) $data;
			}

			if ( ! empty( $lines ) ) {
				$sections[] = "### {$label}\n" . implode( "\n", $lines );
			}
		}

		if ( empty( $sections ) ) {
			return '';
		}

		return "## Current Context\n\n" . implode( "\n\n", $sections );
	}

	/**
	 * Register built-in context providers.
	 */
	private static function ensure_initialized(): void {
		if ( self::$initialized ) {
			return;
		}

		self::$initialized = true;

		// Page context — pass through from widget JS.
		self::register( 'page_context', [ __CLASS__, 'provide_page_context' ], 5 );

		// User context.
		self::register( 'user_context', [ __CLASS__, 'provide_user_context' ], 10 );

		// Site context.
		self::register( 'site_context', [ __CLASS__, 'provide_site_context' ], 15 );

		// Post context — if on a post edit screen.
		self::register( 'post_context', [ __CLASS__, 'provide_post_context' ], 20 );

		// System context.
		self::register( 'system_context', [ __CLASS__, 'provide_system_context' ], 25 );
	}

	/**
	 * Provide page context from the widget.
	 *
	 * @param array $page_context Raw page context from JS.
	 * @return array
	 */
	public static function provide_page_context( array $page_context ): array {
		$data = [];

		if ( ! empty( $page_context['url'] ) ) {
			$data['Current URL'] = $page_context['url'];
		}

		if ( ! empty( $page_context['admin_page'] ) ) {
			$data['Admin Page'] = $page_context['admin_page'];
		}

		if ( ! empty( $page_context['screen_id'] ) ) {
			$data['Screen ID'] = $page_context['screen_id'];
		}

		return $data;
	}

	/**
	 * Provide current user context.
	 *
	 * @param array $page_context Unused.
	 * @return array
	 */
	public static function provide_user_context( array $page_context ): array {
		$user = wp_get_current_user();

		if ( ! $user || ! $user->exists() ) {
			return [];
		}

		return [
			'Name'  => $user->display_name,
			'Login' => $user->user_login,
			'Email' => $user->user_email,
			'Roles' => implode( ', ', $user->roles ),
		];
	}

	/**
	 * Provide site context.
	 *
	 * @param array $page_context Unused.
	 * @return array
	 */
	public static function provide_site_context( array $page_context ): array {
		global $wp_version;

		$theme        = wp_get_theme();
		$plugin_count = count( get_option( 'active_plugins', [] ) );

		$data = [
			'Site Name'    => get_bloginfo( 'name' ),
			'Site URL'     => get_site_url(),
			'WP Version'   => $wp_version,
			'Theme'        => $theme->get( 'Name' ) . ' ' . $theme->get( 'Version' ),
			'Active Plugins' => (string) $plugin_count,
		];

		if ( is_multisite() ) {
			$data['Multisite'] = 'Yes';
		}

		return $data;
	}

	/**
	 * Provide post context if on a post edit screen.
	 *
	 * @param array $page_context Page context from widget.
	 * @return array
	 */
	public static function provide_post_context( array $page_context ): array {
		$post_id = $page_context['post_id'] ?? 0;

		if ( ! $post_id ) {
			return [];
		}

		$post = get_post( (int) $post_id );

		if ( ! $post ) {
			return [];
		}

		$data = [
			'Post ID'    => (string) $post->ID,
			'Title'      => $post->post_title,
			'Type'       => $post->post_type,
			'Status'     => $post->post_status,
			'Author'     => get_the_author_meta( 'display_name', $post->post_author ),
		];

		$categories = wp_get_post_categories( $post->ID, [ 'fields' => 'names' ] );
		if ( ! is_wp_error( $categories ) && ! empty( $categories ) ) {
			$data['Categories'] = $categories;
		}

		$tags = wp_get_post_tags( $post->ID, [ 'fields' => 'names' ] );
		if ( ! is_wp_error( $tags ) && ! empty( $tags ) ) {
			$data['Tags'] = $tags;
		}

		return $data;
	}

	/**
	 * Provide system context.
	 *
	 * @param array $page_context Unused.
	 * @return array
	 */
	public static function provide_system_context( array $page_context ): array {
		global $wpdb;

		$data = [
			'PHP Version'    => PHP_VERSION,
			'Memory Limit'   => ini_get( 'memory_limit' ),
		];

		if ( ! empty( $wpdb->db_server_info ) ) {
			$data['MySQL Version'] = $wpdb->db_server_info();
		} elseif ( method_exists( $wpdb, 'db_version' ) ) {
			$data['MySQL Version'] = $wpdb->db_version();
		}

		if ( ! empty( $_SERVER['SERVER_SOFTWARE'] ) ) {
			$data['Server'] = sanitize_text_field( wp_unslash( $_SERVER['SERVER_SOFTWARE'] ) );
		}

		return $data;
	}
}
