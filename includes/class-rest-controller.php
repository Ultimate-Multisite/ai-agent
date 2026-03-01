<?php
/**
 * REST API controller for the AI Agent.
 *
 * @package AiAgent
 */

namespace AiAgent;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

class Rest_Controller {

	const NAMESPACE = 'ai-agent/v1';

	/**
	 * Register REST routes.
	 */
	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/run',
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ __CLASS__, 'handle_run' ],
				'permission_callback' => [ __CLASS__, 'check_permission' ],
				'args'                => [
					'message'            => [
						'required'          => true,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					],
					'history'            => [
						'required' => false,
						'type'     => 'array',
						'default'  => [],
					],
					'abilities'          => [
						'required' => false,
						'type'     => 'array',
						'default'  => [],
					],
					'system_instruction' => [
						'required'          => false,
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_textarea_field',
					],
					'max_iterations'     => [
						'required'          => false,
						'type'              => 'integer',
						'default'           => 10,
						'sanitize_callback' => 'absint',
					],
				],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/abilities',
			[
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => [ __CLASS__, 'handle_abilities' ],
				'permission_callback' => [ __CLASS__, 'check_permission' ],
			]
		);
	}

	/**
	 * Permission check — admin only.
	 */
	public static function check_permission(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Handle the /run endpoint.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_run( WP_REST_Request $request ) {
		$message        = $request->get_param( 'message' );
		$history_data   = $request->get_param( 'history' );
		$abilities      = $request->get_param( 'abilities' );
		$max_iterations = $request->get_param( 'max_iterations' );

		// Deserialize history from JSON arrays back to Message objects.
		$history = [];
		if ( ! empty( $history_data ) && is_array( $history_data ) ) {
			try {
				$history = Agent_Loop::deserialize_history( $history_data );
			} catch ( \Exception $e ) {
				return new WP_Error(
					'ai_agent_invalid_history',
					__( 'Invalid conversation history format.', 'ai-agent' ),
					[ 'status' => 400 ]
				);
			}
		}

		$options = [
			'max_iterations' => $max_iterations,
		];

		$system_instruction = $request->get_param( 'system_instruction' );
		if ( $system_instruction ) {
			$options['system_instruction'] = $system_instruction;
		}

		$loop   = new Agent_Loop( $message, $abilities, $history, $options );
		$result = $loop->run();

		if ( is_wp_error( $result ) ) {
			$result->add_data( [ 'status' => 500 ] );
			return $result;
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Handle the /abilities endpoint — list available abilities.
	 *
	 * @return WP_REST_Response
	 */
	public static function handle_abilities(): WP_REST_Response {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			return new WP_REST_Response( [], 200 );
		}

		$abilities = wp_get_abilities();
		$list      = [];

		foreach ( $abilities as $ability ) {
			$list[] = [
				'name'        => $ability->get_name(),
				'label'       => $ability->get_label(),
				'description' => $ability->get_description(),
				'category'    => $ability->get_category(),
			];
		}

		return new WP_REST_Response( $list, 200 );
	}
}
