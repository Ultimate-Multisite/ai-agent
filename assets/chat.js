/* global aiAgentData */
(function () {
	'use strict';

	var messagesEl = document.getElementById('ai-agent-messages');
	var inputEl    = document.getElementById('ai-agent-input');
	var sendBtn    = document.getElementById('ai-agent-send');

	if (!messagesEl || !inputEl || !sendBtn) {
		return;
	}

	var history   = [];
	var sending   = false;

	/**
	 * Append a message bubble to the chat.
	 *
	 * @param {string} role    'user' | 'assistant' | 'system'
	 * @param {string} content HTML content.
	 * @return {HTMLElement} The created bubble element.
	 */
	function addMessage(role, content) {
		var bubble = document.createElement('div');
		bubble.className = 'ai-agent-bubble ai-agent-' + role;
		bubble.innerHTML = content;
		messagesEl.appendChild(bubble);
		messagesEl.scrollTop = messagesEl.scrollHeight;
		return bubble;
	}

	/**
	 * Render tool call log entries as collapsible details.
	 *
	 * @param {Array} toolCalls Array of tool call log entries.
	 */
	function renderToolCalls(toolCalls) {
		if (!toolCalls || !toolCalls.length) {
			return;
		}

		var wrapper = document.createElement('div');
		wrapper.className = 'ai-agent-tool-calls';

		var details = document.createElement('details');
		var summary = document.createElement('summary');
		summary.textContent = toolCalls.length + ' tool call' + (toolCalls.length !== 1 ? 's' : '') + ' executed';
		details.appendChild(summary);

		var list = document.createElement('div');
		list.className = 'ai-agent-tool-list';

		for (var i = 0; i < toolCalls.length; i++) {
			var entry = toolCalls[i];
			var item  = document.createElement('div');
			item.className = 'ai-agent-tool-entry ai-agent-tool-' + entry.type;

			if (entry.type === 'call') {
				item.innerHTML =
					'<span class="ai-agent-tool-label">Call:</span> ' +
					'<code>' + escapeHtml(entry.name) + '</code>' +
					'<pre>' + escapeHtml(JSON.stringify(entry.args, null, 2)) + '</pre>';
			} else {
				var responseText = typeof entry.response === 'string'
					? entry.response
					: JSON.stringify(entry.response, null, 2);

				// Truncate long responses.
				if (responseText.length > 500) {
					responseText = responseText.substring(0, 500) + '...';
				}

				item.innerHTML =
					'<span class="ai-agent-tool-label">Result:</span> ' +
					'<code>' + escapeHtml(entry.name) + '</code>' +
					'<pre>' + escapeHtml(responseText) + '</pre>';
			}

			list.appendChild(item);
		}

		details.appendChild(list);
		wrapper.appendChild(details);
		messagesEl.appendChild(wrapper);
		messagesEl.scrollTop = messagesEl.scrollHeight;
	}

	/**
	 * Escape HTML entities.
	 *
	 * @param {string} str Raw string.
	 * @return {string} Escaped string.
	 */
	function escapeHtml(str) {
		if (!str) return '';
		var div = document.createElement('div');
		div.appendChild(document.createTextNode(str));
		return div.innerHTML;
	}

	/**
	 * Send the current input to the REST API.
	 */
	function send() {
		var message = inputEl.value.trim();
		if (!message || sending) {
			return;
		}

		sending = true;
		sendBtn.disabled = true;
		inputEl.disabled = true;

		addMessage('user', escapeHtml(message));
		inputEl.value = '';

		var loader = addMessage('assistant', '<span class="ai-agent-loading">Thinking...</span>');

		var body = {
			message: message,
			history: history,
		};

		fetch(aiAgentData.restUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce':   aiAgentData.nonce,
			},
			body: JSON.stringify(body),
		})
			.then(function (res) {
				return res.json().then(function (data) {
					return { ok: res.ok, data: data };
				});
			})
			.then(function (result) {
				// Remove the loading bubble.
				if (loader && loader.parentNode) {
					loader.parentNode.removeChild(loader);
				}

				if (!result.ok) {
					var errorMsg = (result.data && result.data.message) || 'Unknown error';
					addMessage('system', '<strong>Error:</strong> ' + escapeHtml(errorMsg));
					return;
				}

				// Show tool call activity if any.
				renderToolCalls(result.data.tool_calls);

				// Show the reply.
				addMessage('assistant', escapeHtml(result.data.reply || '(no response)'));

				// Update history for next turn.
				if (result.data.history) {
					history = result.data.history;
				}
			})
			.catch(function (err) {
				if (loader && loader.parentNode) {
					loader.parentNode.removeChild(loader);
				}
				addMessage('system', '<strong>Error:</strong> ' + escapeHtml(err.message || 'Network error'));
			})
			.finally(function () {
				sending = false;
				sendBtn.disabled = false;
				inputEl.disabled = false;
				inputEl.focus();
			});
	}

	// Event listeners.
	sendBtn.addEventListener('click', send);
	inputEl.addEventListener('keydown', function (e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	});

	inputEl.focus();
})();
