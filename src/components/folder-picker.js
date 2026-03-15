/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import STORE_NAME from '../store';

/**
 * Folder picker for moving a session to an existing or new folder.
 *
 * @param {Object}   props               - Component props.
 * @param {string}   props.currentFolder - The session's current folder name.
 * @param {Function} props.onSelect      - Called with the selected folder name (empty = remove).
 * @param {Function} props.onClose       - Called when the picker should close.
 * @return {JSX.Element} Folder picker element.
 */
export default function FolderPicker( { currentFolder, onSelect, onClose } ) {
	const [ newFolder, setNewFolder ] = useState( '' );
	const { fetchFolders } = useDispatch( STORE_NAME );

	const { folders, foldersLoaded } = useSelect(
		( select ) => ( {
			folders: select( STORE_NAME ).getFolders(),
			foldersLoaded: select( STORE_NAME ).getFoldersLoaded(),
		} ),
		[]
	);

	useEffect( () => {
		if ( ! foldersLoaded ) {
			fetchFolders();
		}
	}, [ foldersLoaded, fetchFolders ] );

	return (
		<div className="ai-agent-folder-picker">
			<div className="ai-agent-folder-picker-header">
				{ __( 'Move to Folder', 'ai-agent' ) }
			</div>
			{ currentFolder && (
				<button
					type="button"
					className="ai-agent-folder-picker-item"
					onClick={ () => onSelect( '' ) }
				>
					{ __( 'Remove from folder', 'ai-agent' ) }
				</button>
			) }
			{ folders.map( ( folder ) => (
				<button
					key={ folder }
					type="button"
					className={ `ai-agent-folder-picker-item ${
						folder === currentFolder ? 'is-current' : ''
					}` }
					onClick={ () => onSelect( folder ) }
				>
					{ folder }
				</button>
			) ) }
			<div className="ai-agent-folder-picker-new">
				<input
					type="text"
					placeholder={ __( 'New folder…', 'ai-agent' ) }
					value={ newFolder }
					onChange={ ( e ) => setNewFolder( e.target.value ) }
					onKeyDown={ ( e ) => {
						if ( e.key === 'Enter' && newFolder.trim() ) {
							onSelect( newFolder.trim() );
						}
						if ( e.key === 'Escape' ) {
							onClose();
						}
					} }
				/>
				{ newFolder.trim() && (
					<button
						type="button"
						onClick={ () => onSelect( newFolder.trim() ) }
					>
						{ __( 'Create', 'ai-agent' ) }
					</button>
				) }
			</div>
		</div>
	);
}
