/**
 * WordPress dependencies
 */
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 *
 * Use PrismLight (tree-shakeable build) with explicit language registration
 * to avoid bundling all ~300 Prism grammars. Only the most common languages
 * used in AI chat responses are registered here.
 */
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Register only the languages we need (keeps bundle lean).
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import diff from 'react-syntax-highlighter/dist/esm/languages/prism/diff';
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker';
import graphql from 'react-syntax-highlighter/dist/esm/languages/prism/graphql';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import scss from 'react-syntax-highlighter/dist/esm/languages/prism/scss';
import shell from 'react-syntax-highlighter/dist/esm/languages/prism/shell-session';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import xml from 'react-syntax-highlighter/dist/esm/languages/prism/xml-doc';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';

SyntaxHighlighter.registerLanguage( 'bash', bash );
SyntaxHighlighter.registerLanguage( 'css', css );
SyntaxHighlighter.registerLanguage( 'diff', diff );
SyntaxHighlighter.registerLanguage( 'docker', docker );
SyntaxHighlighter.registerLanguage( 'dockerfile', docker );
SyntaxHighlighter.registerLanguage( 'graphql', graphql );
SyntaxHighlighter.registerLanguage( 'javascript', javascript );
SyntaxHighlighter.registerLanguage( 'js', javascript );
SyntaxHighlighter.registerLanguage( 'json', json );
SyntaxHighlighter.registerLanguage( 'jsx', jsx );
SyntaxHighlighter.registerLanguage( 'markdown', markdown );
SyntaxHighlighter.registerLanguage( 'md', markdown );
SyntaxHighlighter.registerLanguage( 'php', php );
SyntaxHighlighter.registerLanguage( 'python', python );
SyntaxHighlighter.registerLanguage( 'py', python );
SyntaxHighlighter.registerLanguage( 'ruby', ruby );
SyntaxHighlighter.registerLanguage( 'rb', ruby );
SyntaxHighlighter.registerLanguage( 'rust', rust );
SyntaxHighlighter.registerLanguage( 'scss', scss );
SyntaxHighlighter.registerLanguage( 'shell', shell );
SyntaxHighlighter.registerLanguage( 'sh', bash );
SyntaxHighlighter.registerLanguage( 'sql', sql );
SyntaxHighlighter.registerLanguage( 'tsx', tsx );
SyntaxHighlighter.registerLanguage( 'typescript', typescript );
SyntaxHighlighter.registerLanguage( 'ts', typescript );
SyntaxHighlighter.registerLanguage( 'xml', xml );
SyntaxHighlighter.registerLanguage( 'yaml', yaml );
SyntaxHighlighter.registerLanguage( 'yml', yaml );

/**
 * Normalise language aliases to the registered name.
 *
 * @param {string|undefined} lang Raw language identifier from the fenced code block.
 * @return {string} Normalised language name registered with SyntaxHighlighter.
 */
function normaliseLanguage( lang ) {
	if ( ! lang ) {
		return 'text';
	}
	const aliases = {
		js: 'javascript',
		ts: 'typescript',
		py: 'python',
		rb: 'ruby',
		sh: 'bash',
		yml: 'yaml',
		md: 'markdown',
		dockerfile: 'docker',
	};
	return aliases[ lang.toLowerCase() ] ?? lang.toLowerCase();
}

export default function CodeBlock( { language, children } ) {
	const [ copied, setCopied ] = useState( false );
	const [ showLineNumbers, setShowLineNumbers ] = useState( false );
	const [ wrapLines, setWrapLines ] = useState( false );
	const code = String( children ).replace( /\n$/, '' );
	const normalisedLang = normaliseLanguage( language );

	const handleCopy = useCallback( () => {
		navigator.clipboard.writeText( code ).then( () => {
			setCopied( true );
			setTimeout( () => setCopied( false ), 2000 );
		} );
	}, [ code ] );

	return (
		<div className="ai-agent-code-block">
			<div className="ai-agent-code-header">
				{ language && (
					<span className="ai-agent-code-language">{ language }</span>
				) }
				<div className="ai-agent-code-header-actions">
					<button
						className={ `ai-agent-code-toggle${
							showLineNumbers ? ' is-active' : ''
						}` }
						onClick={ () => setShowLineNumbers( ( v ) => ! v ) }
						type="button"
						aria-pressed={ showLineNumbers }
						title={ __( 'Toggle line numbers', 'ai-agent' ) }
					>
						{ __( '#', 'ai-agent' ) }
					</button>
					<button
						className={ `ai-agent-code-toggle${
							wrapLines ? ' is-active' : ''
						}` }
						onClick={ () => setWrapLines( ( v ) => ! v ) }
						type="button"
						aria-pressed={ wrapLines }
						title={ __( 'Toggle word wrap', 'ai-agent' ) }
					>
						{ __( '↵', 'ai-agent' ) }
					</button>
					<button
						className="ai-agent-code-copy"
						onClick={ handleCopy }
						type="button"
					>
						{ copied
							? __( 'Copied!', 'ai-agent' )
							: __( 'Copy', 'ai-agent' ) }
					</button>
				</div>
			</div>
			<SyntaxHighlighter
				style={ oneDark }
				language={ normalisedLang }
				PreTag="div"
				showLineNumbers={ showLineNumbers }
				wrapLines={ wrapLines }
				wrapLongLines={ wrapLines }
				customStyle={ {
					margin: 0,
					borderRadius: '0 0 4px 4px',
					fontSize: '0.85em',
				} }
			>
				{ code }
			</SyntaxHighlighter>
		</div>
	);
}
