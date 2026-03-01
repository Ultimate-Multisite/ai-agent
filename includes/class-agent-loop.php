<?php
/**
 * Core agentic loop orchestration.
 *
 * Sends a prompt, checks for tool calls, executes them,
 * feeds results back, and repeats until the model is done.
 *
 * @package AiAgent
 */

namespace AiAgent;

use WP_AI_Client_Ability_Function_Resolver;
use WP_Error;
use WordPress\AiClient\Messages\DTO\Message;
use WordPress\AiClient\Messages\DTO\MessagePart;
use WordPress\AiClient\Messages\DTO\UserMessage;
use WordPress\AiClient\Messages\Enums\MessageRoleEnum;

class Agent_Loop {

	/** @var string */
	private $user_message;

	/** @var string[] Ability names to enable. */
	private $abilities;

	/** @var Message[] Conversation history. */
	private $history;

	/** @var string */
	private $system_instruction;

	/** @var int */
	private $max_iterations;

	/** @var array Logged tool call activity. */
	private $tool_call_log = [];

	/**
	 * @param string   $user_message The user's prompt.
	 * @param string[] $abilities    Ability names to enable (empty = all).
	 * @param Message[] $history     Prior messages for multi-turn.
	 * @param array    $options      Optional overrides: system_instruction, max_iterations.
	 */
	public function __construct( string $user_message, array $abilities = [], array $history = [], array $options = [] ) {
		$this->user_message       = $user_message;
		$this->abilities          = $abilities;
		$this->history            = $history;
		$this->system_instruction = $options['system_instruction'] ?? $this->default_system_instruction();
		$this->max_iterations     = $options['max_iterations'] ?? 10;
	}

	/**
	 * Run the agentic loop.
	 *
	 * @return array{reply: string, history: array, tool_calls: array}|WP_Error
	 */
	public function run() {
		if ( ! function_exists( 'wp_ai_client_prompt' ) ) {
			return new WP_Error(
				'ai_agent_missing_client',
				__( 'wp_ai_client_prompt() is not available. WordPress 7.0 or the AI Experiments plugin is required.', 'ai-agent' )
			);
		}

		// Append the new user message to history.
		$this->history[] = new UserMessage( [ new MessagePart( $this->user_message ) ] );

		$iterations = $this->max_iterations;

		while ( $iterations > 0 ) {
			$iterations--;

			$result = $this->send_prompt();

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			/** @var \WordPress\AiClient\Results\DTO\GenerativeAiResult $result */
			$assistant_message = $result->toMessage();
			$this->history[]   = $assistant_message;

			// Check if the model wants to call tools.
			if ( ! WP_AI_Client_Ability_Function_Resolver::has_ability_calls( $assistant_message ) ) {
				// No tool calls — we're done.
				$reply = '';

				try {
					$reply = $result->toText();
				} catch ( \RuntimeException $e ) {
					// Model returned no text (unusual), return empty.
					$reply = '';
				}

				return [
					'reply'      => $reply,
					'history'    => $this->serialize_history(),
					'tool_calls' => $this->tool_call_log,
				];
			}

			// Execute the ability calls and get the function response message.
			$this->log_tool_calls( $assistant_message );
			$response_message = WP_AI_Client_Ability_Function_Resolver::execute_abilities( $assistant_message );
			$this->history[]  = $response_message;
			$this->log_tool_responses( $response_message );
		}

		// Exhausted iterations — return what we have.
		return new WP_Error(
			'ai_agent_max_iterations',
			sprintf(
				/* translators: %d: max iterations */
				__( 'Agent reached the maximum of %d iterations without completing.', 'ai-agent' ),
				$this->max_iterations
			)
		);
	}

	/**
	 * Build and send a single prompt with the current history.
	 *
	 * @return \WordPress\AiClient\Results\DTO\GenerativeAiResult|WP_Error
	 */
	private function send_prompt() {
		$builder = wp_ai_client_prompt();

		$builder->using_system_instruction( $this->system_instruction );

		// Use specific model if configured.
		$model = $this->resolve_model();
		if ( $model ) {
			$builder->using_model( $model );
		}

		// Register abilities.
		$abilities = $this->resolve_abilities();
		if ( ! empty( $abilities ) ) {
			$builder->using_abilities( ...$abilities );
		}

		// Pass full conversation history.
		if ( ! empty( $this->history ) ) {
			$builder->with_history( ...$this->history );
		}

		return $builder->generate_text_result();
	}

	/**
	 * Resolve the model to use, checking connector default and options.
	 *
	 * @return \WordPress\AiClient\Providers\Models\Contracts\ModelInterface|null
	 */
	private function resolve_model() {
		// Check if the OpenAI-compatible connector has a default model set.
		if ( function_exists( 'OpenAiCompatibleConnector\\get_default_model' ) ) {
			$model_id = \OpenAiCompatibleConnector\get_default_model();
			if ( ! empty( $model_id ) && class_exists( 'OpenAiCompatibleConnector\\OpenAiCompatProvider' ) ) {
				try {
					$model = \OpenAiCompatibleConnector\OpenAiCompatProvider::model( $model_id );
					$registry = \WordPress\AiClient\AiClient::defaultRegistry();
					$registry->bindModelDependencies( $model );
					return $model;
				} catch ( \Throwable $e ) {
					// Fall through to auto-selection.
				}
			}
		}

		return null;
	}

	/**
	 * Resolve ability names to WP_Ability objects.
	 *
	 * @return \WP_Ability[]
	 */
	private function resolve_abilities(): array {
		if ( ! function_exists( 'wp_get_abilities' ) ) {
			return [];
		}

		$all = wp_get_abilities();

		if ( empty( $this->abilities ) ) {
			return array_values( $all );
		}

		$resolved = [];
		foreach ( $this->abilities as $name ) {
			if ( isset( $all[ $name ] ) ) {
				$resolved[] = $all[ $name ];
			}
		}

		return $resolved;
	}

	/**
	 * Log tool calls from an assistant message for transparency.
	 */
	private function log_tool_calls( Message $message ): void {
		foreach ( $message->getParts() as $part ) {
			$call = $part->getFunctionCall();
			if ( $call ) {
				$this->tool_call_log[] = [
					'type' => 'call',
					'id'   => $call->getId(),
					'name' => $call->getName(),
					'args' => $call->getArgs(),
				];
			}
		}
	}

	/**
	 * Log tool responses for transparency.
	 */
	private function log_tool_responses( Message $message ): void {
		foreach ( $message->getParts() as $part ) {
			$response = $part->getFunctionResponse();
			if ( $response ) {
				$this->tool_call_log[] = [
					'type'     => 'response',
					'id'       => $response->getId(),
					'name'     => $response->getName(),
					'response' => $response->getResponse(),
				];
			}
		}
	}

	/**
	 * Serialize conversation history to transportable arrays.
	 *
	 * @return array
	 */
	private function serialize_history(): array {
		return array_map(
			function ( Message $msg ) {
				return $msg->toArray();
			},
			$this->history
		);
	}

	/**
	 * Deserialize conversation history from arrays back to Message objects.
	 *
	 * @param array $data Serialized history arrays.
	 * @return Message[]
	 */
	public static function deserialize_history( array $data ): array {
		return array_map(
			function ( $item ) {
				return Message::fromArray( $item );
			},
			$data
		);
	}

	/**
	 * Default system instruction for the agent.
	 *
	 * @return string
	 */
	private function default_system_instruction(): string {
		return 'You are a helpful WordPress assistant with access to tools that can interact with this WordPress site. '
			. 'Use the available tools to help the user accomplish their goals. '
			. 'When you need information from the site, call the appropriate tool rather than guessing. '
			. 'After using tools, summarize the results clearly for the user.';
	}
}
