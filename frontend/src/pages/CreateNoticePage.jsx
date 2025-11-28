import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiPostFormData } from '../lib/api.js';

const CATEGORIES = ['Academic','Exam','Events','Hostel','Placement','General'];
const DEPARTMENTS = ['all','CS','Mechanical','Civil','Electrical'];

export default function CreateNoticePage({ user }) {
	const navigate = useNavigate();
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [category, setCategory] = useState('General');
	const [department, setDepartment] = useState('all');
	const [commentEnabled, setCommentEnabled] = useState(true);
	const [files, setFiles] = useState([]);
	const [fileInput, setFileInput] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const isAdmin = user?.role === 'admin';

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);

		try {
			// Validation
			if (!title.trim()) {
				setError('Title is required');
				setLoading(false);
				return;
			}
			if (!content.trim()) {
				setError('Content is required');
				setLoading(false);
				return;
			}

			const formData = new FormData();
			formData.append('title', title.trim());
			formData.append('content', content.trim());
			formData.append('category', category);
			formData.append('department', department);
			formData.append('comment_enabled', commentEnabled);
			
			files.forEach(file => formData.append('files', file));

			const created = await apiPostFormData('/notices', formData);
			setSuccess(`Notice ${isAdmin ? 'published' : 'submitted for approval'} successfully!`);
			
			// Reset form
			setTitle('');
			setContent('');
			setCategory('General');
			setDepartment('all');
			setCommentEnabled(true);
			setFiles([]);
			if (fileInput) fileInput.value = '';

			// Redirect after 1.5 seconds
			setTimeout(() => {
				navigate('/dashboard');
			}, 1500);
		} catch (err) {
			console.error('Submit error:', err);
			setError(err.message || 'Failed to create notice');
		} finally {
			setLoading(false);
		}
	}

	function handleAddFiles(newFiles) {
		setFiles(prev => [...prev, ...Array.from(newFiles)]);
	}

	function handleRemoveFile(index) {
		setFiles(prev => prev.filter((_, i) => i !== index));
	}

	return (
		<div style={{ marginTop: '24px', marginBottom: '40px' }}>
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				marginBottom: '24px'
			}}>
				<div>
					<h1 style={{
						fontSize: '28px',
						fontWeight: '700',
						margin: '0 0 8px 0',
						color: '#1f2937'
					}}>
						📝 Create Notice
					</h1>
					<p style={{
						margin: 0,
						color: '#6b7280',
						fontSize: '14px'
					}}>
						{isAdmin 
							? 'Create a new public notice (appears immediately)'
							: 'Submit a new notice for admin approval'
						}
					</p>
				</div>
				<Link
					to="/dashboard"
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: '6px',
						padding: '10px 16px',
						background: '#f3f4f6',
						color: '#1f2937',
						textDecoration: 'none',
						borderRadius: '8px',
						fontSize: '14px',
						fontWeight: '500',
						cursor: 'pointer',
						transition: 'background 0.2s'
					}}
					onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
					onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
				>
					← Back to Dashboard
				</Link>
			</div>

			<div className="grid">
				<form onSubmit={handleSubmit} className="card panel" style={{ gridColumn: 'span 12' }}>
					{/* Title */}
					<div style={{ marginBottom: '16px' }}>
						<label style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							marginBottom: '6px',
							color: '#1f2937'
						}}>
							Notice Title *
						</label>
						<input
							className="input"
							type="text"
							placeholder="Enter notice title (e.g., 'Library Maintenance Schedule')"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							maxLength="200"
							style={{ fontSize: '15px', padding: '12px' }}
						/>
						<div style={{
							fontSize: '12px',
							color: '#9ca3af',
							marginTop: '4px'
						}}>
							{title.length}/200 characters
						</div>
					</div>

					{/* Content */}
					<div style={{ marginBottom: '16px' }}>
						<label style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							marginBottom: '6px',
							color: '#1f2937'
						}}>
							Notice Content *
						</label>
						<textarea
							className="textarea"
							rows={8}
							placeholder="Enter detailed notice content..."
							value={content}
							onChange={(e) => setContent(e.target.value)}
							style={{ fontSize: '15px', padding: '12px', fontFamily: 'inherit' }}
						/>
						<div style={{
							fontSize: '12px',
							color: '#9ca3af',
							marginTop: '4px'
						}}>
							{content.length} characters
						</div>
					</div>

					{/* Category & Department */}
					<div style={{ marginBottom: '16px' }}>
						<label style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							marginBottom: '6px',
							color: '#1f2937'
						}}>
							Category & Department
						</label>
						<div style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '12px'
						}}>
							<select
								className="select"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								style={{ fontSize: '15px', padding: '12px' }}
							>
								{CATEGORIES.map(c => (
									<option key={c} value={c}>{c}</option>
								))}
							</select>
							<select
								className="select"
								value={department}
								onChange={(e) => setDepartment(e.target.value)}
								style={{ fontSize: '15px', padding: '12px' }}
							>
								{DEPARTMENTS.map(d => (
									<option key={d} value={d}>{d}</option>
								))}
							</select>
						</div>
					</div>

					{/* File Upload */}
					<div style={{ marginBottom: '16px' }}>
						<label style={{
							display: 'block',
							fontSize: '14px',
							fontWeight: '600',
							marginBottom: '6px',
							color: '#1f2937'
						}}>
							Attachments (Optional)
						</label>
						<label style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '16px',
							background: '#f9fafb',
							border: '2px dashed #e5e7eb',
							borderRadius: '8px',
							cursor: 'pointer',
							transition: 'all 0.2s'
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background = '#f3f4f6';
							e.currentTarget.style.borderColor = '#d1d5db';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = '#f9fafb';
							e.currentTarget.style.borderColor = '#e5e7eb';
						}}
						>
							<input
								type="file"
								multiple
								accept="image/*,.pdf,.doc,.docx,.txt"
								ref={setFileInput}
								onChange={(e) => handleAddFiles(e.target.files)}
								style={{ display: 'none' }}
							/>
							<span style={{ fontSize: '18px' }}>📎</span>
							<div>
								<div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
									Click to upload files
								</div>
								<div style={{ fontSize: '12px', color: '#6b7280' }}>
									Images, PDF, DOC, TXT (Max 10MB each)
								</div>
							</div>
						</label>
						
						{/* File List */}
						{files.length > 0 && (
							<div style={{ marginTop: '12px' }}>
								<div style={{
									fontSize: '13px',
									fontWeight: '600',
									color: '#1f2937',
									marginBottom: '8px'
								}}>
									{files.length} file{files.length > 1 ? 's' : ''} selected:
								</div>
								<div style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
									gap: '8px'
								}}>
									{files.map((file, idx) => (
										<div
											key={idx}
											style={{
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'space-between',
												padding: '10px 12px',
												background: '#f0f4ff',
												borderRadius: '6px',
												fontSize: '13px',
												color: '#1f2937'
											}}
										>
											<div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
												📄 {file.name}
												<div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
													{(file.size / 1024).toFixed(1)} KB
												</div>
											</div>
											<button
												type="button"
												onClick={() => handleRemoveFile(idx)}
												style={{
													background: 'none',
													border: 'none',
													color: '#dc2626',
													cursor: 'pointer',
													fontSize: '14px',
													marginLeft: '8px',
													padding: '4px 8px',
													borderRadius: '4px',
													transition: 'background 0.2s'
												}}
												onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
												onMouseLeave={(e) => e.target.style.background = 'none'}
											>
												✕
											</button>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Comment Option */}
					<div style={{ marginBottom: '16px' }}>
						<label style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							fontSize: '14px',
							fontWeight: '500',
							color: '#1f2937',
							cursor: 'pointer'
						}}>
							<input
								type="checkbox"
								checked={commentEnabled}
								onChange={(e) => setCommentEnabled(e.target.checked)}
								style={{ cursor: 'pointer', width: '16px', height: '16px' }}
							/>
							<span>Allow comments on this notice</span>
						</label>
					</div>

					{/* Messages */}
					{error && (
						<div style={{
							padding: '12px 16px',
							background: '#fee2e2',
							color: '#dc2626',
							borderRadius: '8px',
							fontSize: '14px',
							marginBottom: '16px',
							border: '1px solid #fca5a5'
						}}>
							❌ {error}
						</div>
					)}

					{success && (
						<div style={{
							padding: '12px 16px',
							background: '#dcfce7',
							color: '#166534',
							borderRadius: '8px',
							fontSize: '14px',
							marginBottom: '16px',
							border: '1px solid #86efac'
						}}>
							✅ {success}
						</div>
					)}

					{!isAdmin && (
						<div style={{
							padding: '12px 16px',
							background: '#fef3c7',
							color: '#92400e',
							borderRadius: '8px',
							fontSize: '13px',
							marginBottom: '16px',
							border: '1px solid #fcd34d'
						}}>
							ℹ️ Your notice will be submitted for admin approval before being published publicly.
						</div>
					)}

					{/* Submit Button */}
					<div style={{
						display: 'flex',
						gap: '12px',
						justifyContent: 'flex-end',
						marginTop: '24px',
						paddingTop: '16px',
						borderTop: '1px solid #e5e7eb'
					}}>
						<Link
							to="/dashboard"
							style={{
								padding: '12px 24px',
								background: '#f3f4f6',
								color: '#1f2937',
								textDecoration: 'none',
								borderRadius: '8px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: 'pointer',
								transition: 'background 0.2s',
								border: 'none'
							}}
							onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
							onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
						>
							Cancel
						</Link>
						<button
							type="submit"
							disabled={loading}
							className="btn primary"
							style={{
								padding: '12px 32px',
								fontSize: '15px',
								fontWeight: '600',
								opacity: loading ? 0.6 : 1,
								cursor: loading ? 'not-allowed' : 'pointer'
							}}
						>
							{loading ? '⏳ Publishing...' : '✓ Publish Notice'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
