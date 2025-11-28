import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiDelete, apiGet, apiPost } from '../lib/api.js';
import { downloadFile } from '../lib/fileUtil.js';
import NoticeModal from '../ui/NoticeModal.jsx';

const CATEGORIES = ['Academic','Exam','Events','Hostel','Placement','General'];
const DEPARTMENTS = ['all','CS','Mechanical','Civil','Electrical'];

function RowActions({ notice, canApprove, onApprove, onDisapprove, onEdit, onDelete }) {
	return (
		<div className="row">
			<button className="btn" onClick={() => onEdit(notice)}>Edit</button>
			<button className="btn" onClick={() => onDelete(notice)}>Delete</button>
			{canApprove && notice.status === 'pending' && (
				<>
					<button className="btn primary" onClick={() => onApprove(notice)}>✓ Approve</button>
					<button className="btn" style={{ background: '#f97316', color: 'white' }} onClick={() => onDisapprove(notice)}>✗ Reject</button>
				</>
			)}
			{canApprove && notice.status === 'rejected' && (
				<span className="badge" style={{ background: '#dc2626', color: 'white' }}>Rejected</span>
			)}
		</div>
	);
}

export default function DashboardPage({ user }) {
	const [items, setItems] = useState([]);
	const [pendingItems, setPendingItems] = useState([]);
	const [selectedNotice, setSelectedNotice] = useState(null);
	const [q, setQ] = useState('');
	const [category, setCategory] = useState('');
	const [department, setDepartment] = useState('');
	const [page, setPage] = useState(1);
	const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10 });
	const isAdmin = user.role === 'admin';
	const pageCount = useMemo(() => Math.max(1, Math.ceil(data.total / data.pageSize)), [data]);
	
	useEffect(() => {
		// Load pending/rejected notices for admin
		if (isAdmin) {
			apiGet('/notices', { pending: '1', pageSize: 50 })
				.then(d => setPendingItems(d.items))
				.catch(()=>{});
		}
	}, [isAdmin]);
	
	useEffect(() => {
		// Build params object with only defined values
		const params = {
			pageSize: 10,
			page
		};
		
		// Only add filter params if they have values
		if (q) params.q = q;
		if (category) params.category = category;
		if (department) params.department = department;
		
		// For teachers: show own pending/approved notices
		// For admins: show approved notices (edit/delete mode)
		if (isAdmin) {
			// Admins see all approved notices they can manage
			apiGet('/notices', params)
				.then(d => setData(d))
				.catch(() => setData({ items: [], total: 0, page: 1, pageSize: 10 }));
		} else {
			// Teachers see their own notices (both pending and approved)
			apiGet('/notices', { ...params, all_user_notices: '1' })
				.then(d => setData(d))
				.catch(() => setData({ items: [], total: 0, page: 1, pageSize: 10 }));
		}
	}, [q, category, department, page, isAdmin]);
	
	async function handleApprove(n) {
		try {
			const upd = await apiPost(`/notices/${n.id}/approve`);
			setPendingItems(prev => prev.filter(i => i.id !== n.id));
			alert('Notice approved successfully!');
		} catch (err) {
			console.error('Approve error:', err);
			alert('Error approving notice: ' + err.message);
		}
	}
	
	async function handleDisapprove(n) {
		const reason = prompt('Enter reason for disapproval (optional):');
		if (reason === null) return;
		try {
			const upd = await apiPost(`/notices/${n.id}/disapprove`, { reason });
			setPendingItems(prev => prev.map(i => i.id === n.id ? upd : i));
			alert('Notice rejected!');
		} catch (err) {
			console.error('Disapprove error:', err);
			alert('Error rejecting notice: ' + err.message);
		}
	}
	
	async function handleDelete(n) {
		if (!confirm('Delete this notice?')) return;
		try {
			await apiDelete(`/notices/${n.id}`);
			setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== n.id) }));
			alert('Notice deleted successfully!');
		} catch (err) {
			console.error('Delete error:', err);
			alert('Error deleting notice: ' + err.message);
		}
	}
	
	return (
		<>
			<div className="grid" style={{ marginTop: 16 }}>
				{/* Dashboard Header */}
				<div style={{
					gridColumn: 'span 12',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					marginBottom: '16px',
					paddingBottom: '16px',
					borderBottom: '1px solid #e5e7eb'
				}}>
					<h1 style={{
						margin: 0,
						fontSize: '24px',
						fontWeight: '700',
						color: '#1f2937'
					}}>
						📊 {isAdmin ? 'Admin' : 'Teacher'} Dashboard
					</h1>
					<Link
						to="/create-notice"
						className="btn primary"
						style={{
							textDecoration: 'none',
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
							padding: '10px 18px',
							fontSize: '14px',
							fontWeight: '600'
						}}
					>
						📝 Create Notice
					</Link>
				</div>

				{/* Filter Section */}
				<div className="card panel" style={{ gridColumn: 'span 12' }}>
					<div className="row">
						<input 
							className="input" 
							placeholder="Search notices..." 
							value={q} 
							onChange={e => { 
								setQ(e.target.value); 
								setPage(1); 
							}} 
						/>
						<select 
							className="select" 
							value={category} 
							onChange={e => { 
								setCategory(e.target.value); 
								setPage(1); 
							}}
						>
							<option value="">All Types</option>
							{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
						</select>
						<select 
							className="select" 
							value={department} 
							onChange={e => { 
								setDepartment(e.target.value); 
								setPage(1); 
							}}
						>
							<option value="">All Departments</option>
							{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
						</select>
					</div>
				</div>
			</div>

			{/* Pending Approvals Section (Admin Only) */}
			{isAdmin && pendingItems.length > 0 && (
				<div className="grid" style={{ marginTop: 16 }}>
					<div className="card panel" style={{ gridColumn: 'span 12', borderTop: '3px solid #f97316' }}>
						<div className="section-title" style={{ color: '#f97316' }}>⏳ Pending Approvals ({pendingItems.length})</div>
						<div className="spacer" />
						<div className="grid">
							{pendingItems.map(n => {
								const images = n.attachments?.filter(a => a.file_type?.startsWith('image/')) || [];
								const files = n.attachments?.filter(a => !a.file_type?.startsWith('image/')) || [];
								
								return (
									<div key={n.id} className="card panel" style={{ gridColumn: 'span 12', overflow: 'hidden', borderLeft: '4px solid #f97316' }}>
										{images.length > 0 && (
											<div style={{ marginLeft: -16, marginRight: -16, marginTop: -16, marginBottom: 12 }}>
												{images.map(img => (
													<div key={img.id} style={{ overflow: 'hidden', borderRadius: '4px 4px 0 0' }}>
														<img 
															src={img.url} 
															alt={img.original_filename} 
															loading="lazy"
															style={{ 
																width: '100%', 
																height: 'auto',
																minHeight: 150,
																maxHeight: 300,
																objectFit: 'cover',
																display: 'block'
															}} 
															onError={(e) => {
																e.target.src = `/api/notices/files/${img.filename}`;
															}}
														/>
													</div>
												))}
											</div>
										)}
										
										<div className="row" style={{ justifyContent: 'space-between' }}>
											<div style={{ fontWeight: 600, fontSize: 16 }}>{n.title}</div>
											<div className="row">
												<div className="badge blue">{n.category}</div>
												<div className="badge cyan">{n.department}</div>
												<div className="badge" style={{ background: '#f97316', color: 'white' }}>Pending</div>
											</div>
										</div>
										<div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
											By {n.author_name} • {new Date(n.created_at).toLocaleString()}
										</div>
										
										<div style={{ marginTop: 12, marginBottom: 12, lineHeight: 1.5 }}>
											{n.content.slice(0, 200)}{n.content.length > 200 ? '…' : ''}
										</div>
										
										{files.length > 0 && (
											<div style={{ marginBottom: 12, padding: '8px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
												{files.map(file => (
													<div key={file.id} style={{ marginBottom: 6 }}>
														<button 
															onClick={() => downloadFile(file.filename, file.original_filename)}
															className="btn" 
															style={{ fontSize: 12, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
														>
															📎 {file.original_filename}
														</button>
													</div>
												))}
											</div>
										)}
										
										<div className="spacer" />
										<RowActions
											notice={n}
											canApprove={isAdmin}
											onApprove={handleApprove}
											onDisapprove={handleDisapprove}
											onEdit={() => {}}
											onDelete={handleDelete}
										/>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* Notices Grid */}
			<div className="grid" style={{ marginTop: 16 }}>
				<div className="card panel" style={{ gridColumn: 'span 12' }}>
					<div className="section-title">{isAdmin ? 'Approved Notices' : 'Your Notices'}</div>
				</div>
				{data.items && data.items.length > 0 ? (
					data.items.map(n => {
						const images = n.attachments?.filter(a => a.file_type?.startsWith('image/')) || [];
						const files = n.attachments?.filter(a => !a.file_type?.startsWith('image/')) || [];
						
						return (
							<div key={n.id} className="card panel" style={{ gridColumn: 'span 12', overflow: 'hidden' }}>
								{images.length > 0 && (
									<div style={{ marginLeft: -16, marginRight: -16, marginTop: -16, marginBottom: 12 }}>
										{images.map(img => (
											<div key={img.id} style={{ overflow: 'hidden', borderRadius: '4px 4px 0 0' }}>
												<img 
													src={img.url} 
													alt={img.original_filename} 
													loading="lazy"
													style={{ 
														width: '100%', 
														height: 'auto',
														minHeight: 150,
														maxHeight: 300,
														objectFit: 'cover',
														display: 'block'
													}} 
													onError={(e) => {
														e.target.src = `/api/notices/files/${img.filename}`;
													}}
												/>
											</div>
										))}
									</div>
								)}
								
								<div className="row" style={{ justifyContent: 'space-between' }}>
									<div style={{ fontWeight: 600, fontSize: 16 }}>{n.title}</div>
									<div className="row">
										<div className="badge blue">{n.category}</div>
										<div className="badge cyan">{n.department}</div>
									</div>
								</div>
								<div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
									{new Date(n.created_at).toLocaleString()} • ✓ {n.status === 'approved' ? 'Approved' : 'Pending'}
								</div>
								
								<div style={{ marginTop: 12, marginBottom: 12, lineHeight: 1.5 }}>
									{n.content.slice(0, 200)}{n.content.length > 200 ? '…' : ''}
								</div>
								
								{files.length > 0 && (
									<div style={{ marginBottom: 12, padding: '8px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
										{files.map(file => (
											<div key={file.id} style={{ marginBottom: 6 }}>
												<button 
													onClick={() => downloadFile(file.filename, file.original_filename)}
													className="btn" 
													style={{ fontSize: 12, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit' }}
												>
													📎 {file.original_filename}
												</button>
											</div>
										))}
									</div>
								)}
								
								<div className="spacer" />
								<div className="row">
									<button className="btn" onClick={() => setSelectedNotice(n)}>👁️ View Details</button>
									<button className="btn" onClick={() => handleDelete(n)}>Delete</button>
								</div>
							</div>
						);
					})
				) : (
					<div className="card panel" style={{ gridColumn: 'span 12', textAlign: 'center', padding: 40 }}>
						<div className="muted">No notices found matching your filters.</div>
					</div>
			)}
		</div>

		{/* NOTICE MODAL */}
			{selectedNotice && (
				<NoticeModal 
					notice={selectedNotice} 
					user={user} 
					onClose={() => setSelectedNotice(null)} 
				/>
			)}
		</>
	);
}


