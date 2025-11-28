import { useState, useEffect } from 'react';
import { apiPost } from '../lib/api.js';
import { getSecureFileUrl, downloadFile } from '../lib/fileUtil.js';
import Feedback from './Feedback.jsx';

export default function NoticeModal({ notice, user, onClose }) {
	const [liked, setLiked] = useState(notice.user_liked || false);
	const [likeCount, setLikeCount] = useState(notice.like_count || 0);
	const [selectedImage, setSelectedImage] = useState(null);

	// Separate images and files
	const images = notice.attachments?.filter(a => a.file_type?.startsWith('image/')) || [];
	const files = notice.attachments?.filter(a => !a.file_type?.startsWith('image/')) || [];

	console.log('NoticeModal rendering notice:', notice.id, notice.title);
	console.log('Attachments:', notice.attachments);
	console.log('Images:', images);
	console.log('Files:', files);

	async function handleLike() {
		if (!user) return;
		try {
			const res = await apiPost(`/notices/${notice.id}/like`);
			setLiked(res.liked);
			setLikeCount(prev => res.liked ? prev + 1 : Math.max(0, prev - 1));
		} catch (err) {
			console.error('Like failed:', err);
		}
	}

	return (
		<>
			{/* MODAL OVERLAY */}
			<div
				style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					zIndex: 1000,
					padding: 20,
					overflowY: 'auto'
				}}
				onClick={onClose}
			>
				{/* MODAL CONTENT */}
				<div
					className="card panel"
					style={{
						width: '100%',
						maxWidth: 800,
						maxHeight: '90vh',
						overflowY: 'auto',
						boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
					}}
					onClick={e => e.stopPropagation()}
			>
				{/* CLOSE BUTTON */}
				<button
					onClick={onClose}
					style={{
						position: 'absolute',
						top: 16,
						right: 16,
					background: 'linear-gradient(135deg, rgba(107, 91, 255, 0.9), rgba(94, 199, 255, 0.9))',
					border: 'none',
					fontSize: 16,
					cursor: 'pointer',
						color: 'white',
					zIndex: 1001,
					width: 32,
					height: 32,
					borderRadius: 8,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					boxShadow: '0 4px 16px rgba(94, 199, 255, 0.3)',
					transition: 'all 0.2s ease',
					padding: 0
					}}
					onMouseEnter={(e) => {
						e.target.style.transform = 'scale(1.1)';
						e.target.style.boxShadow = '0 6px 24px rgba(94, 199, 255, 0.5)';
					}}
					onMouseLeave={(e) => {
						e.target.style.transform = 'scale(1)';
						e.target.style.boxShadow = '0 4px 16px rgba(94, 199, 255, 0.3)';
					}}
				>
					✕
				</button>					{/* IMAGE GALLERY - Full Width */}
					{images.length > 0 && (
						<div style={{ marginBottom: 24 }}>
							<h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#333' }}>
								📸 Images ({images.length})
							</h3>
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
								{images.map(img => (
									<SecureImageThumbnail 
										key={img.id}
										img={img}
										onSelect={() => setSelectedImage(img)}
									/>
								))}
							</div>
						</div>
					)}

				{/* NOTICE INFO */}
				<div style={{ marginBottom: 24 }}>
					<div className="row" style={{ justifyContent: 'space-between', marginBottom: 12, paddingRight: 50 }}>
						<div className="badge blue">{notice.category}</div>
						<div className="badge cyan">{notice.department}</div>
					</div>						<h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>
							{notice.title}
						</h1>

						<div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
							By <strong>{notice.author_name}</strong> • {new Date(notice.created_at).toLocaleString()}
						</div>

						<div style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
							{notice.content}
						</div>
					</div>

					{/* FILES/ATTACHMENTS */}
					{files.length > 0 && (
						<div style={{ marginBottom: 24 }}>
							<h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#333' }}>
								📎 Attachments ({files.length})
							</h3>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								{files.map(file => (
									<button
										key={file.id}
										onClick={() => downloadFile(file.filename, file.original_filename)}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 12,
											padding: '12px 16px',
											backgroundColor: '#f5f5f5',
											border: '1px solid #e0e0e0',
											borderRadius: 6,
											textDecoration: 'none',
											color: '#1976d2',
											cursor: 'pointer',
											transition: 'all 0.2s',
											textAlign: 'left'
										}}
										onMouseEnter={e => {
											e.currentTarget.style.backgroundColor = '#e3f2fd';
											e.currentTarget.style.borderColor = '#1976d2';
										}}
										onMouseLeave={e => {
											e.currentTarget.style.backgroundColor = '#f5f5f5';
											e.currentTarget.style.borderColor = '#e0e0e0';
										}}
									>
										<span style={{ fontSize: 20 }}>📄</span>
										<div style={{ flex: 1 }}>
											<div style={{ fontWeight: 500 }}>{file.original_filename}</div>
											<div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
												Click to download
											</div>
										</div>
										<span style={{ fontSize: 12, color: '#999' }}>↓</span>
									</button>
								))}
							</div>
						</div>
					)}

					{/* ACTION BUTTONS */}
					<div className="row" style={{ gap: 8, marginBottom: 24 }}>
						<button
							className="btn ghost"
							onClick={handleLike}
							disabled={!user}
							style={{ display: 'flex', alignItems: 'center', gap: 6 }}
						>
							{liked ? '❤️' : '🤍'} Like ({likeCount})
						</button>
						<a
							className="btn"
							href={`/api/notices/${notice.id}/export/pdf`}
							target="_blank"
							rel="noreferrer"
						>
							📥 Download as PDF
						</a>
					</div>

					{/* FEEDBACK/COMMENTS SECTION */}
					<div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 24 }}>
						<h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
							💬 Feedback & Comments
						</h3>
						<Feedback
							noticeId={notice.id}
							user={user}
							commentEnabled={notice.comment_enabled}
						/>
					</div>
				</div>
			</div>

			{/* IMAGE LIGHTBOX */}
			{selectedImage && (
				<SecureImageLightbox 
					image={selectedImage}
					onClose={() => setSelectedImage(null)}
				/>
			)}
		</>
	);
}

// Component for secure image thumbnail with authentication
function SecureImageThumbnail({ img, onSelect }) {
	const [src, setSrc] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getSecureFileUrl(img.filename)
			.then(url => {
				setSrc(url);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, [img.filename]);

	return (
		<div
			onClick={onSelect}
			style={{
				cursor: 'pointer',
				overflow: 'hidden',
				borderRadius: 8,
				backgroundColor: '#f5f5f5',
				border: '1px solid #e0e0e0',
				transition: 'transform 0.2s, box-shadow 0.2s',
				aspectRatio: '16/9'
			}}
			onMouseEnter={e => {
				e.currentTarget.style.transform = 'scale(1.05)';
				e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
			}}
			onMouseLeave={e => {
				e.currentTarget.style.transform = 'scale(1)';
				e.currentTarget.style.boxShadow = 'none';
			}}
		>
			{loading ? (
				<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
					Loading...
				</div>
			) : src ? (
				<img
					src={src}
					alt={img.original_filename}
					style={{
						width: '100%',
						height: '100%',
						objectFit: 'cover'
					}}
				/>
			) : (
				<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
					Failed to load
				</div>
			)}
		</div>
	);
}

// Component for secure image lightbox with authentication
function SecureImageLightbox({ image, onClose }) {
	const [src, setSrc] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getSecureFileUrl(image.filename)
			.then(url => {
				setSrc(url);
				setLoading(false);
			})
			.catch(() => {
				setLoading(false);
			});
	}, [image.filename]);

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.9)',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				zIndex: 1001,
				padding: 20
			}}
			onClick={onClose}
		>
			<div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
				{loading ? (
					<div style={{ color: 'white', textAlign: 'center' }}>Loading image...</div>
				) : src ? (
					<img
						src={src}
						alt={image.original_filename}
						style={{
							maxWidth: '100%',
							maxHeight: '100%',
							objectFit: 'contain'
						}}
					/>
				) : (
					<div style={{ color: 'white', textAlign: 'center' }}>Failed to load image</div>
				)}
				<button
				onClick={onClose}
				style={{
					position: 'absolute',
					top: 16,
					right: 16,
					background: 'linear-gradient(135deg, rgba(107, 91, 255, 0.9), rgba(94, 199, 255, 0.9))',
					border: 'none',
					fontSize: 16,
					cursor: 'pointer',
					borderRadius: 8,
					width: 32,
					height: 32,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: 'white',
					boxShadow: '0 4px 16px rgba(94, 199, 255, 0.3)',
					transition: 'all 0.2s ease',
					padding: 0
					}}
					onMouseEnter={(e) => {
						e.target.style.transform = 'scale(1.1)';
						e.target.style.boxShadow = '0 6px 24px rgba(94, 199, 255, 0.5)';
					}}
					onMouseLeave={(e) => {
						e.target.style.transform = 'scale(1)';
						e.target.style.boxShadow = '0 4px 16px rgba(94, 199, 255, 0.3)';
					}}
				>
					✕
				</button>
			</div>
		</div>
	);
}
