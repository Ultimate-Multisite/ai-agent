/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import STORE_NAME from '../store';
import ErrorBoundary from './error-boundary';
import ProviderSelector from './provider-selector';
import MessageList from './message-list';
import MessageInput from './message-input';
import ContextIndicator from './context-indicator';
import ToolConfirmationDialog from './tool-confirmation-dialog';

export default function ChatPanel( { compact = false, onSlashCommand } ) {
	const { confirmToolCall, rejectToolCall } = useDispatch( STORE_NAME );
	const { pendingConfirmation, debugMode } = useSelect(
		( select ) => ( {
			pendingConfirmation: select( STORE_NAME ).getPendingConfirmation(),
			debugMode: select( STORE_NAME ).isDebugMode(),
		} ),
		[]
	);

	return (
		<ErrorBoundary label={ __( 'Chat', 'ai-agent' ) }>
			<div
				className={ `ai-agent-chat-panel ${
					compact ? 'is-compact' : ''
				}` }
			>
				<div className="ai-agent-header">
					<ProviderSelector compact={ compact } />
					{ debugMode && (
						<span className="ai-agent-debug-badge">
							{ __( 'DEBUG', 'ai-agent' ) }
						</span>
					) }
				</div>
				<ContextIndicator />
				<ErrorBoundary label={ __( 'Message list', 'ai-agent' ) }>
					<MessageList />
				</ErrorBoundary>
				<ErrorBoundary label={ __( 'Message input', 'ai-agent' ) }>
					<MessageInput
						compact={ compact }
						onSlashCommand={ onSlashCommand }
					/>
				</ErrorBoundary>
				{ pendingConfirmation && (
					<ToolConfirmationDialog
						confirmation={ pendingConfirmation }
						onConfirm={ ( alwaysAllow ) =>
							confirmToolCall(
								pendingConfirmation.jobId,
								alwaysAllow
							)
						}
						onReject={ () =>
							rejectToolCall( pendingConfirmation.jobId )
						}
					/>
				) }
			</div>
		</ErrorBoundary>
	);
}
