/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Collapsible details panel showing tool calls and their results.
 * Returns null when there are no tool calls.
 *
 * @param {Object}                        props           - Component props.
 * @param {import('../store').ToolCall[]} props.toolCalls - Tool call entries to display.
 * @return {JSX.Element|null} Tool call details element, or null if empty.
 */
export default function ToolCallDetails( { toolCalls } ) {
	if ( ! toolCalls?.length ) {
		return null;
	}

	return (
		<div className="ai-agent-tool-calls">
			<details>
				<summary>
					{ toolCalls.length }{ ' ' }
					{ toolCalls.length === 1
						? __( 'tool call executed', 'ai-agent' )
						: __( 'tool calls executed', 'ai-agent' ) }
				</summary>
				<div className="ai-agent-tool-list">
					{ toolCalls.map( ( entry, i ) => (
						<div
							key={ i }
							className={ `ai-agent-tool-entry ai-agent-tool-${ entry.type }` }
						>
							{ entry.type === 'call' ? (
								<>
									<span className="ai-agent-tool-label">
										{ __( 'Call:', 'ai-agent' ) }
									</span>{ ' ' }
									<code>{ entry.name }</code>
									<pre>
										{ JSON.stringify(
											entry.args,
											null,
											2
										) }
									</pre>
								</>
							) : (
								<>
									<span className="ai-agent-tool-label">
										{ __( 'Result:', 'ai-agent' ) }
									</span>{ ' ' }
									<code>{ entry.name }</code>
									<pre>
										{ truncate(
											typeof entry.response === 'string'
												? entry.response
												: JSON.stringify(
														entry.response,
														null,
														2
												  ),
											500
										) }
									</pre>
								</>
							) }
						</div>
					) ) }
				</div>
			</details>
		</div>
	);
}

/**
 * Truncate a string to a maximum length, appending '...' if truncated.
 *
 * @param {string} str - Input string.
 * @param {number} max - Maximum character length.
 * @return {string} Truncated string.
 */
function truncate( str, max ) {
	if ( ! str ) {
		return '';
	}
	return str.length > max ? str.substring( 0, max ) + '...' : str;
}
