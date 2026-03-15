/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * @typedef {Object} Provider
 * @property {string}  id     - Provider identifier.
 * @property {string}  name   - Display name.
 * @property {Model[]} models - Available models for this provider.
 */

/**
 * @typedef {Object} Model
 * @property {string} id   - Model identifier.
 * @property {string} name - Display name.
 */

/**
 * @typedef {Object} MessagePart
 * @property {string} [text] - Text content of the message part.
 */

/**
 * @typedef {Object} DebugInfo
 * @property {number}                               responseTimeMs  - Time from send to response in ms.
 * @property {{prompt: number, completion: number}} tokenUsage      - Token counts.
 * @property {number}                               tokensPerSecond - Output tokens per second.
 * @property {string}                               modelId         - Model used for this response.
 * @property {number}                               costEstimate    - Estimated cost in USD.
 * @property {number}                               iterationsUsed  - Number of tool-call iterations.
 * @property {number}                               toolCallCount   - Number of tool calls made.
 * @property {string[]}                             toolNames       - Unique tool names used.
 */

/**
 * @typedef {Object} Message
 * @property {'user'|'model'|'system'|'function'} role        - Message role.
 * @property {MessagePart[]}                      parts       - Message content parts.
 * @property {ToolCall[]}                         [toolCalls] - Tool calls attached to this message.
 * @property {DebugInfo}                          [debug]     - Debug metadata (debug mode only).
 */

/**
 * @typedef {Object} ToolCall
 * @property {'call'|'result'} type       - Whether this is a call or its result.
 * @property {string}          name       - Tool name.
 * @property {Object}          [args]     - Arguments passed to the tool.
 * @property {*}               [response] - Tool response value.
 */

/**
 * @typedef {Object} Session
 * @property {number|string}                        id            - Session ID.
 * @property {string}                               [title]       - Session title.
 * @property {string}                               [status]      - 'active' | 'archived' | 'trash'.
 * @property {string}                               [folder]      - Folder name.
 * @property {number|string}                        [pinned]      - 1 if pinned, 0 otherwise.
 * @property {string}                               [provider_id] - Provider used for this session.
 * @property {string}                               [model_id]    - Model used for this session.
 * @property {string}                               [updated_at]  - ISO date string (without Z).
 * @property {{prompt: number, completion: number}} [token_usage] - Token counts.
 */

/**
 * @typedef {Object} Memory
 * @property {number} id       - Memory ID.
 * @property {string} category - Memory category slug.
 * @property {string} content  - Memory text content.
 */

/**
 * @typedef {Object} Skill
 * @property {number}  id           - Skill ID.
 * @property {string}  name         - Skill name/slug.
 * @property {string}  [content]    - Skill prompt content.
 * @property {boolean} [isReadonly] - Whether the skill is system-defined.
 */

/**
 * @typedef {Object} TokenUsage
 * @property {number} prompt     - Input/prompt tokens used.
 * @property {number} completion - Output/completion tokens used.
 */

/**
 * @typedef {Object} PendingConfirmation
 * @property {string}     jobId - Job ID awaiting confirmation.
 * @property {ToolCall[]} tools - Tools pending user approval.
 */

/**
 * @typedef {Object} StoreState
 * @property {Provider[]}               providers               - Available AI providers.
 * @property {boolean}                  providersLoaded         - Whether providers have been fetched.
 * @property {Session[]}                sessions                - Session list.
 * @property {boolean}                  sessionsLoaded          - Whether sessions have been fetched.
 * @property {number|null}              currentSessionId        - Active session ID.
 * @property {Message[]}                currentSessionMessages  - Messages in the active session.
 * @property {ToolCall[]}               currentSessionToolCalls - Tool calls in the active session.
 * @property {boolean}                  sending                 - Whether a message is in-flight.
 * @property {string|null}              currentJobId            - Active job ID.
 * @property {string}                   selectedProviderId      - Selected provider ID.
 * @property {string}                   selectedModelId         - Selected model ID.
 * @property {boolean}                  floatingOpen            - Whether the floating panel is open.
 * @property {boolean}                  floatingMinimized       - Whether the floating panel is minimized.
 * @property {Object}                   pageContext             - Structured page context for the agent.
 * @property {string}                   sessionFilter           - Active session list filter.
 * @property {string}                   sessionFolder           - Active folder filter.
 * @property {string}                   sessionSearch           - Active search query.
 * @property {string[]}                 folders                 - Available folder names.
 * @property {boolean}                  foldersLoaded           - Whether folders have been fetched.
 * @property {Object|null}              settings                - Plugin settings object.
 * @property {boolean}                  settingsLoaded          - Whether settings have been fetched.
 * @property {Memory[]}                 memories                - Stored memories.
 * @property {boolean}                  memoriesLoaded          - Whether memories have been fetched.
 * @property {Skill[]}                  skills                  - Registered skills.
 * @property {boolean}                  skillsLoaded            - Whether skills have been fetched.
 * @property {TokenUsage}               tokenUsage              - Cumulative token usage for the session.
 * @property {PendingConfirmation|null} pendingConfirmation     - Tool call awaiting user confirmation.
 * @property {boolean}                  debugMode               - Whether debug mode is active.
 * @property {number}                   sendTimestamp           - Timestamp of the last send (ms).
 */

const STORE_NAME = 'ai-agent';

/**
 * Known model context windows (tokens).
 */
const MODEL_CONTEXT_WINDOWS = {
	'claude-sonnet-4-20250514': 200000,
	'claude-opus-4-20250115': 200000,
	'gpt-4o': 128000,
	'gpt-4o-mini': 128000,
};

const DEFAULT_STATE = {
	providers: [],
	providersLoaded: false,
	sessions: [],
	sessionsLoaded: false,
	currentSessionId: null,
	currentSessionMessages: [],
	currentSessionToolCalls: [],
	sending: false,
	currentJobId: null,
	selectedProviderId: localStorage.getItem( 'aiAgentProvider' ) || '',
	selectedModelId: localStorage.getItem( 'aiAgentModel' ) || '',
	floatingOpen: false,
	floatingMinimized: false,
	pageContext: '',

	// Session filters
	sessionFilter: 'active',
	sessionFolder: '',
	sessionSearch: '',
	folders: [],
	foldersLoaded: false,

	// Settings
	settings: null,
	settingsLoaded: false,

	// Memory
	memories: [],
	memoriesLoaded: false,

	// Skills
	skills: [],
	skillsLoaded: false,

	// Token usage (current session)
	tokenUsage: { prompt: 0, completion: 0 },

	// Pending confirmation (Batch 8)
	pendingConfirmation: null,

	// Debug mode
	debugMode: localStorage.getItem( 'aiAgentDebugMode' ) === 'true',
	sendTimestamp: 0,
};

const actions = {
	/**
	 * Set the list of available AI providers.
	 *
	 * @param {Provider[]} providers - Provider objects from the API.
	 * @return {Object} Redux action.
	 */
	setProviders( providers ) {
		return { type: 'SET_PROVIDERS', providers };
	},
	/**
	 * Set the list of sessions.
	 *
	 * @param {Session[]} sessions - Session objects from the API.
	 * @return {Object} Redux action.
	 */
	setSessions( sessions ) {
		return { type: 'SET_SESSIONS', sessions };
	},
	/**
	 * Set the active session and its messages/tool calls.
	 *
	 * @param {number}     sessionId - Session ID.
	 * @param {Message[]}  messages  - Messages for the session.
	 * @param {ToolCall[]} toolCalls - Tool calls for the session.
	 * @return {Object} Redux action.
	 */
	setCurrentSession( sessionId, messages, toolCalls ) {
		return {
			type: 'SET_CURRENT_SESSION',
			sessionId,
			messages,
			toolCalls,
		};
	},
	/**
	 * Clear the active session (start a new chat).
	 *
	 * @return {Object} Redux action.
	 */
	clearCurrentSession() {
		return { type: 'CLEAR_CURRENT_SESSION' };
	},
	/**
	 * Set the sending state.
	 *
	 * @param {boolean} sending - Whether a message is in-flight.
	 * @return {Object} Redux action.
	 */
	setSending( sending ) {
		return { type: 'SET_SENDING', sending };
	},
	/**
	 * Set the current background job ID.
	 *
	 * @param {string|null} jobId - Job ID, or null to clear.
	 * @return {Object} Redux action.
	 */
	setCurrentJobId( jobId ) {
		return { type: 'SET_CURRENT_JOB_ID', jobId };
	},
	/**
	 * Set the selected provider and persist to localStorage.
	 *
	 * @param {string} providerId - Provider ID to select.
	 * @return {Object} Redux action.
	 */
	setSelectedProvider( providerId ) {
		localStorage.setItem( 'aiAgentProvider', providerId );
		return { type: 'SET_SELECTED_PROVIDER', providerId };
	},
	/**
	 * Set the selected model and persist to localStorage.
	 *
	 * @param {string} modelId - Model ID to select.
	 * @return {Object} Redux action.
	 */
	setSelectedModel( modelId ) {
		localStorage.setItem( 'aiAgentModel', modelId );
		return { type: 'SET_SELECTED_MODEL', modelId };
	},
	/**
	 * Open or close the floating chat panel.
	 *
	 * @param {boolean} open - Whether the panel should be open.
	 * @return {Object} Redux action.
	 */
	setFloatingOpen( open ) {
		return { type: 'SET_FLOATING_OPEN', open };
	},
	/**
	 * Minimize or expand the floating chat panel.
	 *
	 * @param {boolean} minimized - Whether the panel should be minimized.
	 * @return {Object} Redux action.
	 */
	setFloatingMinimized( minimized ) {
		return { type: 'SET_FLOATING_MINIMIZED', minimized };
	},
	/**
	 * Set structured page context for the agent.
	 *
	 * @param {Object} context - Page context object (url, admin_page, etc.).
	 * @return {Object} Redux action.
	 */
	setPageContext( context ) {
		return { type: 'SET_PAGE_CONTEXT', context };
	},
	/**
	 * Append a message to the current session's message list.
	 *
	 * @param {Message} message - Message to append.
	 * @return {Object} Redux action.
	 */
	appendMessage( message ) {
		return { type: 'APPEND_MESSAGE', message };
	},
	/**
	 * Remove the last message from the current session.
	 *
	 * @return {Object} Redux action.
	 */
	removeLastMessage() {
		return { type: 'REMOVE_LAST_MESSAGE' };
	},
	/**
	 * Set the plugin settings object.
	 *
	 * @param {Object} settings - Settings from the API.
	 * @return {Object} Redux action.
	 */
	setSettings( settings ) {
		return { type: 'SET_SETTINGS', settings };
	},
	/**
	 * Set the list of stored memories.
	 *
	 * @param {Memory[]} memories - Memory objects from the API.
	 * @return {Object} Redux action.
	 */
	setMemories( memories ) {
		return { type: 'SET_MEMORIES', memories };
	},
	/**
	 * Set the list of registered skills.
	 *
	 * @param {Skill[]} skills - Skill objects from the API.
	 * @return {Object} Redux action.
	 */
	setSkills( skills ) {
		return { type: 'SET_SKILLS', skills };
	},
	/**
	 * Set the cumulative token usage for the current session.
	 *
	 * @param {TokenUsage} tokenUsage - Token usage counts.
	 * @return {Object} Redux action.
	 */
	setTokenUsage( tokenUsage ) {
		return { type: 'SET_TOKEN_USAGE', tokenUsage };
	},
	/**
	 * Set the session list filter.
	 *
	 * @param {string} filter - Filter value: 'active' | 'archived' | 'trash'.
	 * @return {Object} Redux action.
	 */
	setSessionFilter( filter ) {
		return { type: 'SET_SESSION_FILTER', filter };
	},
	/**
	 * Set the active folder filter for the session list.
	 *
	 * @param {string} folder - Folder name, or empty string for all.
	 * @return {Object} Redux action.
	 */
	setSessionFolder( folder ) {
		return { type: 'SET_SESSION_FOLDER', folder };
	},
	/**
	 * Set the session search query.
	 *
	 * @param {string} search - Search string.
	 * @return {Object} Redux action.
	 */
	setSessionSearch( search ) {
		return { type: 'SET_SESSION_SEARCH', search };
	},
	/**
	 * Set the list of available folder names.
	 *
	 * @param {string[]} folders - Folder names from the API.
	 * @return {Object} Redux action.
	 */
	setFolders( folders ) {
		return { type: 'SET_FOLDERS', folders };
	},
	/**
	 * Set the pending tool confirmation state.
	 *
	 * @param {PendingConfirmation|null} confirmation - Confirmation data, or null to clear.
	 * @return {Object} Redux action.
	 */
	setPendingConfirmation( confirmation ) {
		return { type: 'SET_PENDING_CONFIRMATION', confirmation };
	},
	/**
	 * Truncate the message list to the given index (exclusive).
	 *
	 * @param {number} index - Messages at or after this index are removed.
	 * @return {Object} Redux action.
	 */
	truncateMessagesTo( index ) {
		return { type: 'TRUNCATE_MESSAGES_TO', index };
	},
	/**
	 * Enable or disable debug mode and persist to localStorage.
	 *
	 * @param {boolean} enabled - Whether debug mode should be active.
	 * @return {Object} Redux action.
	 */
	setDebugMode( enabled ) {
		localStorage.setItem( 'aiAgentDebugMode', enabled ? 'true' : 'false' );
		return { type: 'SET_DEBUG_MODE', enabled };
	},
	/**
	 * Record the timestamp when a message was sent.
	 *
	 * @param {number} ts - Unix timestamp in milliseconds.
	 * @return {Object} Redux action.
	 */
	setSendTimestamp( ts ) {
		return { type: 'SET_SEND_TIMESTAMP', ts };
	},

	// ─── Thunks ──────────────────────────────────────────────────

	/**
	 * Fetch available AI providers from the REST API.
	 * Auto-selects the first provider/model if none is saved.
	 *
	 * @return {Function} Thunk.
	 */
	fetchProviders() {
		return async ( { dispatch } ) => {
			try {
				const providers = await apiFetch( {
					path: '/ai-agent/v1/providers',
				} );
				dispatch.setProviders( providers );

				// Auto-select first provider if none saved or saved one is unavailable.
				const saved = localStorage.getItem( 'aiAgentProvider' );
				if (
					( ! saved ||
						! providers.find( ( p ) => p.id === saved ) ) &&
					providers.length
				) {
					dispatch.setSelectedProvider( providers[ 0 ].id );
					if ( providers[ 0 ].models?.length ) {
						dispatch.setSelectedModel(
							providers[ 0 ].models[ 0 ].id
						);
					} else {
						dispatch.setSelectedModel( '' );
					}
				}
			} catch {
				dispatch.setProviders( [] );
			}
		};
	},

	/**
	 * Fetch sessions from the REST API, applying current filter/folder/search.
	 *
	 * @return {Function} Thunk.
	 */
	fetchSessions() {
		return async ( { dispatch, select } ) => {
			try {
				const params = new URLSearchParams();
				const filter = select.getSessionFilter();
				const folder = select.getSessionFolder();
				const search = select.getSessionSearch();

				if ( filter ) {
					params.set( 'status', filter );
				}
				if ( folder ) {
					params.set( 'folder', folder );
				}
				if ( search ) {
					params.set( 'search', search );
				}

				const qs = params.toString();
				const path = '/ai-agent/v1/sessions' + ( qs ? '?' + qs : '' );

				const sessions = await apiFetch( { path } );
				dispatch.setSessions( sessions );
			} catch {
				dispatch.setSessions( [] );
			}
		};
	},

	/**
	 * Open a session by ID, loading its messages and restoring provider/model.
	 *
	 * @param {number} sessionId - Session ID to open.
	 * @return {Function} Thunk.
	 */
	openSession( sessionId ) {
		return async ( { dispatch, select } ) => {
			try {
				const session = await apiFetch( {
					path: `/ai-agent/v1/sessions/${ sessionId }`,
				} );
				dispatch.setCurrentSession(
					session.id,
					session.messages || [],
					session.tool_calls || []
				);
				// Only restore provider/model if the provider is still available.
				if ( session.provider_id ) {
					const providers = select.getProviders();
					const providerExists = providers.some(
						( p ) => p.id === session.provider_id
					);
					if ( providerExists ) {
						dispatch.setSelectedProvider( session.provider_id );
						if ( session.model_id ) {
							dispatch.setSelectedModel( session.model_id );
						}
					}
				}
				if ( session.token_usage ) {
					dispatch.setTokenUsage( session.token_usage );
				}
			} catch {
				// ignore
			}
		};
	},

	/**
	 * Permanently delete a session.
	 *
	 * @param {number} sessionId - Session ID to delete.
	 * @return {Function} Thunk.
	 */
	deleteSession( sessionId ) {
		return async ( { dispatch, select } ) => {
			try {
				await apiFetch( {
					path: `/ai-agent/v1/sessions/${ sessionId }`,
					method: 'DELETE',
				} );
				if ( select.getCurrentSessionId() === sessionId ) {
					dispatch.clearCurrentSession();
				}
				dispatch.fetchSessions();
			} catch {
				// ignore
			}
		};
	},

	/**
	 * Pin or unpin a session.
	 *
	 * @param {number}  sessionId - Session ID.
	 * @param {boolean} pinned    - Whether to pin the session.
	 * @return {Function} Thunk.
	 */
	pinSession( sessionId, pinned ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/sessions/${ sessionId }`,
				method: 'PATCH',
				data: { pinned },
			} );
			dispatch.fetchSessions();
		};
	},

	/**
	 * Archive a session (move to archived status).
	 *
	 * @param {number} sessionId - Session ID to archive.
	 * @return {Function} Thunk.
	 */
	archiveSession( sessionId ) {
		return async ( { dispatch, select } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/sessions/${ sessionId }`,
				method: 'PATCH',
				data: { status: 'archived' },
			} );
			if ( select.getCurrentSessionId() === sessionId ) {
				dispatch.clearCurrentSession();
			}
			dispatch.fetchSessions();
		};
	},

	/**
	 * Move a session to trash.
	 *
	 * @param {number} sessionId - Session ID to trash.
	 * @return {Function} Thunk.
	 */
	trashSession( sessionId ) {
		return async ( { dispatch, select } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/sessions/${ sessionId }`,
				method: 'PATCH',
				data: { status: 'trash' },
			} );
			if ( select.getCurrentSessionId() === sessionId ) {
				dispatch.clearCurrentSession();
			}
			dispatch.fetchSessions();
		};
	},

	/**
	 * Restore a trashed or archived session to active status.
	 *
	 * @param {number} sessionId - Session ID to restore.
	 * @return {Function} Thunk.
	 */
	restoreSession( sessionId ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/sessions/${ sessionId }`,
				method: 'PATCH',
				data: { status: 'active' },
			} );
			dispatch.fetchSessions();
		};
	},

	/**
	 * Move a session to a folder.
	 *
	 * @param {number} sessionId - Session ID.
	 * @param {string} folder    - Target folder name, or empty string to remove.
	 * @return {Function} Thunk.
	 */
	moveSessionToFolder( sessionId, folder ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/sessions/${ sessionId }`,
				method: 'PATCH',
				data: { folder },
			} );
			dispatch.fetchSessions();
			dispatch.fetchFolders();
		};
	},

	/**
	 * Rename a session.
	 *
	 * @param {number} sessionId - Session ID.
	 * @param {string} title     - New title.
	 * @return {Function} Thunk.
	 */
	renameSession( sessionId, title ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/sessions/${ sessionId }`,
				method: 'PATCH',
				data: { title },
			} );
			dispatch.fetchSessions();
		};
	},

	/**
	 * Fetch the list of session folder names from the REST API.
	 *
	 * @return {Function} Thunk.
	 */
	fetchFolders() {
		return async ( { dispatch } ) => {
			try {
				const folders = await apiFetch( {
					path: '/ai-agent/v1/sessions/folders',
				} );
				dispatch.setFolders( folders );
			} catch {
				dispatch.setFolders( [] );
			}
		};
	},

	/**
	 * Export a session and trigger a file download.
	 *
	 * @param {number}            sessionId       - Session ID to export.
	 * @param {'json'|'markdown'} [format='json'] - Export format.
	 * @return {Function} Thunk.
	 */
	exportSession( sessionId, format = 'json' ) {
		return async () => {
			const result = await apiFetch( {
				path: `/ai-agent/v1/sessions/${ sessionId }/export?format=${ format }`,
			} );
			const content =
				format === 'json'
					? JSON.stringify( result.content, null, 2 )
					: result.content;
			const blob = new Blob( [ content ], {
				type: format === 'json' ? 'application/json' : 'text/markdown',
			} );
			const url = URL.createObjectURL( blob );
			const a = document.createElement( 'a' );
			a.href = url;
			a.download = result.filename;
			a.click();
			URL.revokeObjectURL( url );
		};
	},

	/**
	 * Import a session from exported JSON data.
	 *
	 * @param {Object} data - Parsed JSON export data (format: 'ai-agent-v1').
	 * @return {Function} Thunk.
	 */
	importSession( data ) {
		return async ( { dispatch } ) => {
			const session = await apiFetch( {
				path: '/ai-agent/v1/sessions/import',
				method: 'POST',
				data,
			} );
			dispatch.fetchSessions();
			dispatch.openSession( session.id );
		};
	},

	/**
	 * Regenerate the AI response at the given message index.
	 * Finds the preceding user message and re-sends it.
	 *
	 * @param {number} index - Index of the message to regenerate from.
	 * @return {Function} Thunk.
	 */
	regenerateMessage( index ) {
		return async ( { dispatch, select } ) => {
			const messages = select.getCurrentSessionMessages();
			// Find the user message at or before this index.
			let userIdx = index;
			while ( userIdx >= 0 && messages[ userIdx ]?.role !== 'user' ) {
				userIdx--;
			}
			if ( userIdx < 0 ) {
				return;
			}
			const userText = messages[ userIdx ]?.parts
				?.filter( ( p ) => p.text )
				.map( ( p ) => p.text )
				.join( '' );
			if ( ! userText ) {
				return;
			}
			// Truncate to just before this user message.
			dispatch.truncateMessagesTo( userIdx );
			dispatch.sendMessage( userText );
		};
	},

	/**
	 * Truncate messages to the given index and re-send with new text.
	 *
	 * @param {number} index   - Index to truncate at.
	 * @param {string} newText - Replacement message text.
	 * @return {Function} Thunk.
	 */
	editAndResend( index, newText ) {
		return async ( { dispatch } ) => {
			dispatch.truncateMessagesTo( index );
			dispatch.sendMessage( newText );
		};
	},

	/**
	 * Cancel the current in-flight generation.
	 *
	 * @return {Function} Thunk.
	 */
	stopGeneration() {
		return async ( { dispatch } ) => {
			dispatch.setCurrentJobId( null );
			dispatch.setSending( false );
		};
	},

	/**
	 * Confirm a pending tool call and resume the job.
	 *
	 * @param {string}  jobId               - Job ID awaiting confirmation.
	 * @param {boolean} [alwaysAllow=false] - If true, set tool permission to Auto.
	 * @return {Function} Thunk.
	 */
	confirmToolCall( jobId, alwaysAllow = false ) {
		return async ( { dispatch } ) => {
			dispatch.setPendingConfirmation( null );
			try {
				await apiFetch( {
					path: `/ai-agent/v1/job/${ jobId }/confirm`,
					method: 'POST',
					data: { always_allow: alwaysAllow },
				} );
				dispatch.pollJob( jobId );
			} catch ( err ) {
				dispatch.appendMessage( {
					role: 'system',
					parts: [
						{
							text: `Error: ${
								err.message || 'Failed to confirm tool call'
							}`,
						},
					],
				} );
				dispatch.setSending( false );
				dispatch.setCurrentJobId( null );
			}
		};
	},

	/**
	 * Reject a pending tool call and resume the job without executing it.
	 *
	 * @param {string} jobId - Job ID awaiting confirmation.
	 * @return {Function} Thunk.
	 */
	rejectToolCall( jobId ) {
		return async ( { dispatch } ) => {
			dispatch.setPendingConfirmation( null );
			try {
				await apiFetch( {
					path: `/ai-agent/v1/job/${ jobId }/reject`,
					method: 'POST',
				} );
				dispatch.pollJob( jobId );
			} catch ( err ) {
				dispatch.appendMessage( {
					role: 'system',
					parts: [
						{
							text: `Error: ${
								err.message || 'Failed to reject tool call'
							}`,
						},
					],
				} );
				dispatch.setSending( false );
				dispatch.setCurrentJobId( null );
			}
		};
	},

	/**
	 * Send a user message. Creates a session if none is active, then starts a job.
	 *
	 * @param {string} message - User message text.
	 * @return {Function} Thunk.
	 */
	sendMessage( message ) {
		return async ( { dispatch, select } ) => {
			dispatch.setSending( true );

			// Append user message to UI immediately.
			dispatch.appendMessage( {
				role: 'user',
				parts: [ { text: message } ],
			} );

			let sessionId = select.getCurrentSessionId();

			// Lazy create session on first message.
			if ( ! sessionId ) {
				try {
					const session = await apiFetch( {
						path: '/ai-agent/v1/sessions',
						method: 'POST',
						data: {
							provider_id: select.getSelectedProviderId(),
							model_id: select.getSelectedModelId(),
						},
					} );
					sessionId = session.id;
					dispatch.setCurrentSession(
						session.id,
						select.getCurrentSessionMessages(),
						[]
					);
				} catch {
					dispatch.appendMessage( {
						role: 'system',
						parts: [
							{
								text: 'Error: Failed to create session.',
							},
						],
					} );
					dispatch.setSending( false );
					return;
				}
			}

			// Build the request body.
			const body = {
				message,
				session_id: sessionId,
				provider_id: select.getSelectedProviderId(),
				model_id: select.getSelectedModelId(),
			};

			// Include structured page context if available.
			const pageContext = select.getPageContext();
			if ( pageContext ) {
				body.page_context = pageContext;
			}

			dispatch.setSendTimestamp( Date.now() );

			try {
				const result = await apiFetch( {
					path: '/ai-agent/v1/run',
					method: 'POST',
					data: body,
				} );

				if ( ! result.job_id ) {
					throw new Error( 'No job_id returned' );
				}

				dispatch.setCurrentJobId( result.job_id );
				dispatch.pollJob( result.job_id );
			} catch ( err ) {
				dispatch.appendMessage( {
					role: 'system',
					parts: [
						{
							text: `Error: ${
								err.message || 'Failed to start job'
							}`,
						},
					],
				} );
				dispatch.setSending( false );
			}
		};
	},

	/**
	 * Poll a background job until it completes, errors, or requires confirmation.
	 * Retries every 3 seconds up to 200 attempts (~10 minutes).
	 *
	 * @param {string} jobId - Job ID to poll.
	 * @return {Function} Thunk.
	 */
	pollJob( jobId ) {
		return async ( { dispatch, select } ) => {
			let attempts = 0;
			const maxAttempts = 200;

			const poll = async () => {
				attempts++;
				if ( attempts > maxAttempts ) {
					dispatch.appendMessage( {
						role: 'system',
						parts: [ { text: 'Error: Request timed out.' } ],
					} );
					dispatch.setSending( false );
					dispatch.setCurrentJobId( null );
					return;
				}

				// If job was cancelled (different jobId now), stop.
				if ( select.getCurrentJobId() !== jobId ) {
					return;
				}

				try {
					const result = await apiFetch( {
						path: `/ai-agent/v1/job/${ jobId }`,
					} );

					if ( result.status === 'processing' ) {
						setTimeout( poll, 3000 );
						return;
					}

					if ( result.status === 'awaiting_confirmation' ) {
						dispatch.setPendingConfirmation( {
							jobId,
							tools: result.pending_tools || [],
						} );
						// Don't clear sending — we're still waiting.
						return;
					}

					if ( result.status === 'error' ) {
						dispatch.appendMessage( {
							role: 'system',
							parts: [
								{
									text: `Error: ${
										result.message || 'Unknown error'
									}`,
								},
							],
						} );
					}

					if ( result.status === 'complete' ) {
						// Add assistant reply.
						if ( result.reply ) {
							const msg = {
								role: 'model',
								parts: [ { text: result.reply } ],
								toolCalls: result.tool_calls,
							};

							// Attach debug metadata when debug mode is active.
							if ( select.isDebugMode() ) {
								const sendTs = select.getSendTimestamp();
								const elapsed = sendTs
									? Date.now() - sendTs
									: 0;
								const tu = result.token_usage || {};
								const completionTokens = tu.completion || 0;
								const promptTokens = tu.prompt || 0;
								const tokPerSec =
									elapsed > 0
										? completionTokens / ( elapsed / 1000 )
										: 0;

								// Derive tool call count and names.
								const tc = result.tool_calls || [];
								const toolCalls = tc.filter(
									( t ) => t.type === 'call'
								);
								const toolNames = [
									...new Set(
										toolCalls.map( ( t ) => t.name )
									),
								];

								msg.debug = {
									responseTimeMs: elapsed,
									tokenUsage: {
										prompt: promptTokens,
										completion: completionTokens,
									},
									tokensPerSecond:
										Math.round( tokPerSec * 10 ) / 10,
									modelId: result.model_id || '',
									costEstimate: result.cost_estimate || 0,
									iterationsUsed: result.iterations_used || 0,
									toolCallCount: toolCalls.length,
									toolNames,
								};
							}

							dispatch.appendMessage( msg );
						}

						if ( result.session_id ) {
							dispatch.setCurrentSession(
								result.session_id,
								select.getCurrentSessionMessages(),
								select.getCurrentSessionToolCalls()
							);
						}

						// Update token usage.
						if ( result.token_usage ) {
							const current = select.getTokenUsage();
							dispatch.setTokenUsage( {
								prompt:
									current.prompt +
									( result.token_usage.prompt || 0 ),
								completion:
									current.completion +
									( result.token_usage.completion || 0 ),
							} );
						}

						dispatch.fetchSessions();
					}
				} catch {
					// Network blip — keep polling.
					setTimeout( poll, 3000 );
					return;
				}

				dispatch.setSending( false );
				dispatch.setCurrentJobId( null );
			};

			setTimeout( poll, 2000 );
		};
	},

	// ─── Settings thunks ─────────────────────────────────────────

	/**
	 * Fetch plugin settings from the REST API.
	 *
	 * @return {Function} Thunk.
	 */
	fetchSettings() {
		return async ( { dispatch } ) => {
			try {
				const settings = await apiFetch( {
					path: '/ai-agent/v1/settings',
				} );
				dispatch.setSettings( settings );
			} catch {
				dispatch.setSettings( {} );
			}
		};
	},

	/**
	 * Save plugin settings via the REST API.
	 *
	 * @param {Object} data - Settings fields to update.
	 * @return {Function} Thunk that resolves with the saved settings object.
	 */
	saveSettings( data ) {
		return async ( { dispatch } ) => {
			try {
				const settings = await apiFetch( {
					path: '/ai-agent/v1/settings',
					method: 'POST',
					data,
				} );
				dispatch.setSettings( settings );
				return settings;
			} catch ( err ) {
				throw err;
			}
		};
	},

	// ─── Memory thunks ───────────────────────────────────────────

	/**
	 * Fetch stored memories from the REST API.
	 *
	 * @return {Function} Thunk.
	 */
	fetchMemories() {
		return async ( { dispatch } ) => {
			try {
				const memories = await apiFetch( {
					path: '/ai-agent/v1/memory',
				} );
				dispatch.setMemories( memories );
			} catch {
				dispatch.setMemories( [] );
			}
		};
	},

	/**
	 * Create a new memory entry.
	 *
	 * @param {string} category - Memory category slug.
	 * @param {string} content  - Memory text content.
	 * @return {Function} Thunk.
	 */
	createMemory( category, content ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: '/ai-agent/v1/memory',
				method: 'POST',
				data: { category, content },
			} );
			dispatch.fetchMemories();
		};
	},

	/**
	 * Update an existing memory entry.
	 *
	 * @param {number} id   - Memory ID.
	 * @param {Object} data - Fields to update (category, content).
	 * @return {Function} Thunk.
	 */
	updateMemory( id, data ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/memory/${ id }`,
				method: 'PATCH',
				data,
			} );
			dispatch.fetchMemories();
		};
	},

	/**
	 * Delete a memory entry.
	 *
	 * @param {number} id - Memory ID to delete.
	 * @return {Function} Thunk.
	 */
	deleteMemory( id ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/memory/${ id }`,
				method: 'DELETE',
			} );
			dispatch.fetchMemories();
		};
	},

	// ─── Skills thunks ──────────────────────────────────────────

	/**
	 * Fetch registered skills from the REST API.
	 *
	 * @return {Function} Thunk.
	 */
	fetchSkills() {
		return async ( { dispatch } ) => {
			try {
				const skills = await apiFetch( {
					path: '/ai-agent/v1/skills',
				} );
				dispatch.setSkills( skills );
			} catch {
				dispatch.setSkills( [] );
			}
		};
	},

	/**
	 * Create a new skill.
	 *
	 * @param {Object} data - Skill fields (name, content, etc.).
	 * @return {Function} Thunk.
	 */
	createSkill( data ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: '/ai-agent/v1/skills',
				method: 'POST',
				data,
			} );
			dispatch.fetchSkills();
		};
	},

	/**
	 * Update an existing skill.
	 *
	 * @param {number} id   - Skill ID.
	 * @param {Object} data - Fields to update.
	 * @return {Function} Thunk.
	 */
	updateSkill( id, data ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/skills/${ id }`,
				method: 'PATCH',
				data,
			} );
			dispatch.fetchSkills();
		};
	},

	/**
	 * Delete a skill.
	 *
	 * @param {number} id - Skill ID to delete.
	 * @return {Function} Thunk.
	 */
	deleteSkill( id ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/skills/${ id }`,
				method: 'DELETE',
			} );
			dispatch.fetchSkills();
		};
	},

	/**
	 * Reset a skill to its system default content.
	 *
	 * @param {number} id - Skill ID to reset.
	 * @return {Function} Thunk.
	 */
	resetSkill( id ) {
		return async ( { dispatch } ) => {
			await apiFetch( {
				path: `/ai-agent/v1/skills/${ id }/reset`,
				method: 'POST',
			} );
			dispatch.fetchSkills();
		};
	},

	// ─── Compact thunk ───────────────────────────────────────────

	/**
	 * Compact the current conversation into a new session with a summary.
	 * Creates a new session and sends the full conversation as context.
	 *
	 * @return {Function} Thunk.
	 */
	compactConversation() {
		return async ( { dispatch, select } ) => {
			const messages = select.getCurrentSessionMessages();
			if ( ! messages.length ) {
				return;
			}

			// Build a summary request.
			const summaryText = messages
				.map( ( m ) => {
					const role = m.role === 'model' ? 'Assistant' : 'User';
					const text = m.parts
						?.filter( ( p ) => p.text )
						.map( ( p ) => p.text )
						.join( '' );
					return text ? `${ role }: ${ text }` : null;
				} )
				.filter( Boolean )
				.join( '\n' );

			// Create a new session.
			try {
				const session = await apiFetch( {
					path: '/ai-agent/v1/sessions',
					method: 'POST',
					data: {
						title: 'Compacted conversation',
						provider_id: select.getSelectedProviderId(),
						model_id: select.getSelectedModelId(),
					},
				} );

				// Send the summary as the first message in the new session.
				dispatch.setCurrentSession( session.id, [], [] );
				dispatch.setTokenUsage( { prompt: 0, completion: 0 } );
				dispatch.sendMessage(
					'Please provide a concise summary of this conversation so we can continue in a fresh context:\n\n' +
						summaryText
				);
				dispatch.fetchSessions();
			} catch {
				// ignore
			}
		};
	},
};

const selectors = {
	/**
	 * Get the list of available AI providers.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {Provider[]} Providers.
	 */
	getProviders( state ) {
		return state.providers;
	},
	/**
	 * Whether providers have been fetched from the API.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if providers have loaded.
	 */
	getProvidersLoaded( state ) {
		return state.providersLoaded;
	},
	/**
	 * Get the list of sessions.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {Session[]} Sessions.
	 */
	getSessions( state ) {
		return state.sessions;
	},
	/**
	 * Whether sessions have been fetched from the API.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if sessions have loaded.
	 */
	getSessionsLoaded( state ) {
		return state.sessionsLoaded;
	},
	/**
	 * Get the active session ID.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {number|null} Session ID, or null if no session is open.
	 */
	getCurrentSessionId( state ) {
		return state.currentSessionId;
	},
	/**
	 * Get the messages for the active session.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {Message[]} Messages.
	 */
	getCurrentSessionMessages( state ) {
		return state.currentSessionMessages;
	},
	/**
	 * Get the tool calls for the active session.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {ToolCall[]} Tool calls.
	 */
	getCurrentSessionToolCalls( state ) {
		return state.currentSessionToolCalls;
	},
	/**
	 * Whether a message is currently being sent/processed.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if sending.
	 */
	isSending( state ) {
		return state.sending;
	},
	/**
	 * Get the current background job ID.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {string|null} Job ID, or null if no job is running.
	 */
	getCurrentJobId( state ) {
		return state.currentJobId;
	},
	/**
	 * Get the selected provider ID.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {string} Provider ID.
	 */
	getSelectedProviderId( state ) {
		return state.selectedProviderId;
	},
	/**
	 * Get the selected model ID.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {string} Model ID.
	 */
	getSelectedModelId( state ) {
		return state.selectedModelId;
	},
	/**
	 * Get the models available for the currently selected provider.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {Model[]} Models for the selected provider.
	 */
	getSelectedProviderModels( state ) {
		const provider = state.providers.find(
			( p ) => p.id === state.selectedProviderId
		);
		return provider?.models || [];
	},
	/**
	 * Whether the floating chat panel is open.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if open.
	 */
	isFloatingOpen( state ) {
		return state.floatingOpen;
	},
	/**
	 * Whether the floating chat panel is minimized.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if minimized.
	 */
	isFloatingMinimized( state ) {
		return state.floatingMinimized;
	},
	/**
	 * Get the structured page context for the agent.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {Object} Page context object.
	 */
	getPageContext( state ) {
		return state.pageContext;
	},

	// Settings
	/**
	 * Get the plugin settings object.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {Object|null} Settings, or null if not yet loaded.
	 */
	getSettings( state ) {
		return state.settings;
	},
	/**
	 * Whether settings have been fetched from the API.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if settings have loaded.
	 */
	getSettingsLoaded( state ) {
		return state.settingsLoaded;
	},

	// Memory
	/**
	 * Get the list of stored memories.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {Memory[]} Memories.
	 */
	getMemories( state ) {
		return state.memories;
	},
	/**
	 * Whether memories have been fetched from the API.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if memories have loaded.
	 */
	getMemoriesLoaded( state ) {
		return state.memoriesLoaded;
	},

	// Skills
	/**
	 * Get the list of registered skills.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {Skill[]} Skills.
	 */
	getSkills( state ) {
		return state.skills;
	},
	/**
	 * Whether skills have been fetched from the API.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if skills have loaded.
	 */
	getSkillsLoaded( state ) {
		return state.skillsLoaded;
	},

	// Session filters
	/**
	 * Get the active session list filter.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {string} Filter value: 'active' | 'archived' | 'trash'.
	 */
	getSessionFilter( state ) {
		return state.sessionFilter;
	},
	/**
	 * Get the active folder filter for the session list.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {string} Folder name, or empty string for all.
	 */
	getSessionFolder( state ) {
		return state.sessionFolder;
	},
	/**
	 * Get the active session search query.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {string} Search string.
	 */
	getSessionSearch( state ) {
		return state.sessionSearch;
	},
	/**
	 * Get the list of available folder names.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {string[]} Folder names.
	 */
	getFolders( state ) {
		return state.folders;
	},
	/**
	 * Whether folders have been fetched from the API.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if folders have loaded.
	 */
	getFoldersLoaded( state ) {
		return state.foldersLoaded;
	},

	// Pending confirmation
	/**
	 * Get the pending tool confirmation state.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {PendingConfirmation|null} Confirmation data, or null if none pending.
	 */
	getPendingConfirmation( state ) {
		return state.pendingConfirmation;
	},

	// Debug mode
	/**
	 * Whether debug mode is active.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if debug mode is on.
	 */
	isDebugMode( state ) {
		return state.debugMode;
	},
	/**
	 * Get the timestamp of the last message send.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {number} Unix timestamp in milliseconds.
	 */
	getSendTimestamp( state ) {
		return state.sendTimestamp;
	},

	// Token usage
	/**
	 * Get the cumulative token usage for the current session.
	 *
	 * @param {StoreState} state - Store state.
	 * @return {TokenUsage} Token usage counts.
	 */
	getTokenUsage( state ) {
		return state.tokenUsage;
	},
	/**
	 * Get the context window usage as a percentage (0–100+).
	 *
	 * @param {StoreState} state - Store state.
	 * @return {number} Percentage of context window used.
	 */
	getContextPercentage( state ) {
		const contextLimit =
			MODEL_CONTEXT_WINDOWS[ state.selectedModelId ] ||
			state.settings?.context_window_default ||
			128000;
		return ( state.tokenUsage.prompt / contextLimit ) * 100;
	},
	/**
	 * Whether the context window usage exceeds the warning threshold (80%).
	 *
	 * @param {StoreState} state - Store state.
	 * @return {boolean} True if context usage is above 80%.
	 */
	isContextWarning( state ) {
		const contextLimit =
			MODEL_CONTEXT_WINDOWS[ state.selectedModelId ] ||
			state.settings?.context_window_default ||
			128000;
		return ( state.tokenUsage.prompt / contextLimit ) * 100 > 80;
	},
};

/**
 * Redux reducer for the ai-agent store.
 *
 * @param {StoreState} state  - Current state.
 * @param {Object}     action - Dispatched action.
 * @return {StoreState} Next state.
 */
const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_PROVIDERS':
			return {
				...state,
				providers: action.providers,
				providersLoaded: true,
			};
		case 'SET_SESSIONS':
			return {
				...state,
				sessions: action.sessions,
				sessionsLoaded: true,
			};
		case 'SET_CURRENT_SESSION':
			return {
				...state,
				currentSessionId: action.sessionId,
				currentSessionMessages: action.messages,
				currentSessionToolCalls: action.toolCalls,
			};
		case 'CLEAR_CURRENT_SESSION':
			return {
				...state,
				currentSessionId: null,
				currentSessionMessages: [],
				currentSessionToolCalls: [],
				tokenUsage: { prompt: 0, completion: 0 },
			};
		case 'SET_SENDING':
			return { ...state, sending: action.sending };
		case 'SET_CURRENT_JOB_ID':
			return { ...state, currentJobId: action.jobId };
		case 'SET_SELECTED_PROVIDER':
			return { ...state, selectedProviderId: action.providerId };
		case 'SET_SELECTED_MODEL':
			return { ...state, selectedModelId: action.modelId };
		case 'SET_FLOATING_OPEN':
			return { ...state, floatingOpen: action.open };
		case 'SET_FLOATING_MINIMIZED':
			return { ...state, floatingMinimized: action.minimized };
		case 'SET_PAGE_CONTEXT':
			return { ...state, pageContext: action.context };
		case 'APPEND_MESSAGE':
			return {
				...state,
				currentSessionMessages: [
					...state.currentSessionMessages,
					action.message,
				],
			};
		case 'REMOVE_LAST_MESSAGE':
			return {
				...state,
				currentSessionMessages: state.currentSessionMessages.slice(
					0,
					-1
				),
			};
		case 'SET_SETTINGS':
			return {
				...state,
				settings: action.settings,
				settingsLoaded: true,
			};
		case 'SET_MEMORIES':
			return {
				...state,
				memories: action.memories,
				memoriesLoaded: true,
			};
		case 'SET_SKILLS':
			return {
				...state,
				skills: action.skills,
				skillsLoaded: true,
			};
		case 'SET_TOKEN_USAGE':
			return { ...state, tokenUsage: action.tokenUsage };
		case 'SET_SESSION_FILTER':
			return { ...state, sessionFilter: action.filter };
		case 'SET_SESSION_FOLDER':
			return { ...state, sessionFolder: action.folder };
		case 'SET_SESSION_SEARCH':
			return { ...state, sessionSearch: action.search };
		case 'SET_FOLDERS':
			return { ...state, folders: action.folders, foldersLoaded: true };
		case 'SET_PENDING_CONFIRMATION':
			return { ...state, pendingConfirmation: action.confirmation };
		case 'TRUNCATE_MESSAGES_TO':
			return {
				...state,
				currentSessionMessages: state.currentSessionMessages.slice(
					0,
					action.index
				),
			};
		case 'SET_DEBUG_MODE':
			return { ...state, debugMode: action.enabled };
		case 'SET_SEND_TIMESTAMP':
			return { ...state, sendTimestamp: action.ts };
		default:
			return state;
	}
};

const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );

export default STORE_NAME;
