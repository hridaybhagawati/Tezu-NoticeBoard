import { useState, useEffect } from 'react';
import { getSecureFileUrl } from '../lib/fileUtil.js';

export default function SecureImage({ filename, alt, style, onClick, onError, ...props }) {
	const [src, setSrc] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		let isMounted = true;
		console.log('[SecureImage] Mounting for:', filename);
		
		getSecureFileUrl(filename)
			.then(url => {
				console.log('[SecureImage] Got URL:', url);
				if (isMounted) {
					setSrc(url);
					setLoading(false);
				}
			})
			.catch(err => {
				console.error('[SecureImage] Fetch error:', filename, err.message);
				if (isMounted) {
					setError(err.message);
					setLoading(false);
					if (onError) {
						onError({ target: { style: { display: 'none' } } });
					}
				}
			});

		return () => {
			isMounted = false;
		};
	}, [filename, onError]);

	if (loading) {
		return (
			<div
				style={{
					...style,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#f0f0f0',
					color: '#999',
					fontSize: 12
				}}
			>
				Loading {filename.substring(filename.lastIndexOf('-') + 1)}...
			</div>
		);
	}

	if (error || !src) {
		console.error('[SecureImage] Rendering error state. Error:', error, 'Src:', src);
		return (
			<div
				style={{
					...style,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: '#fee',
					color: '#933',
					fontSize: 11,
					padding: 8,
					overflow: 'hidden',
					textAlign: 'center'
				}}
				title={error || 'Failed to load image'}
			>
				<div style={{ wordBreak: 'break-word' }}>
					{error ? `Error: ${error.substring(0, 50)}` : 'Failed to load'}
				</div>
			</div>
		);
	}

	return (
		<img
			src={src}
			alt={alt}
			style={style}
			onClick={onClick}
			onError={(e) => {
				console.error('[SecureImage] Img tag error event');
				if (onError) onError(e);
			}}
			{...props}
		/>
	);
}
