/**
 * WordPress dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';

/**
 * Hook to register keyboard shortcuts.
 *
 * @param {Object} shortcuts Map of shortcut key combos to handlers.
 *                           Keys use format: "mod+k", "mod+n", "escape", "mod+/"
 *                           "mod" maps to Cmd on Mac, Ctrl on others.
 */
export function useKeyboardShortcuts( shortcuts ) {
	const isMac =
		typeof navigator !== 'undefined' &&
		navigator.platform.indexOf( 'Mac' ) > -1;

	const handler = useCallback(
		( e ) => {
			for ( const [ combo, fn ] of Object.entries( shortcuts ) ) {
				if ( matchesCombo( e, combo, isMac ) ) {
					e.preventDefault();
					fn( e );
					return;
				}
			}
		},
		[ shortcuts, isMac ]
	);

	useEffect( () => {
		document.addEventListener( 'keydown', handler );
		return () => document.removeEventListener( 'keydown', handler );
	}, [ handler ] );
}

function matchesCombo( e, combo, isMac ) {
	const parts = combo.toLowerCase().split( '+' );
	let needMod = false;
	let needShift = false;
	let key = '';

	for ( const part of parts ) {
		if ( part === 'mod' ) {
			needMod = true;
		} else if ( part === 'shift' ) {
			needShift = true;
		} else {
			key = part;
		}
	}

	if ( needMod ) {
		const modPressed = isMac ? e.metaKey : e.ctrlKey;
		if ( ! modPressed ) {
			return false;
		}
	}

	if ( needShift && ! e.shiftKey ) {
		return false;
	}

	// Map key names.
	const eventKey = e.key.toLowerCase();
	if ( key === 'escape' && eventKey === 'escape' ) {
		return true;
	}
	if ( key === '/' && ( eventKey === '/' || e.code === 'Slash' ) ) {
		return true;
	}

	return eventKey === key;
}

/**
 * All available keyboard shortcuts for the help dialog.
 */
export const SHORTCUTS = [
	{ combo: 'mod+n', label: 'New chat' },
	{ combo: 'mod+k', label: 'Search conversations' },
	{ combo: 'mod+/', label: 'Show shortcuts' },
	{ combo: 'Escape', label: 'Close dialog' },
];
