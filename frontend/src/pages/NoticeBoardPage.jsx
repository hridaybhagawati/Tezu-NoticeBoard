import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/api.js';
import NoticeModal from '../ui/NoticeModal.jsx';
import SecureImage from '../components/SecureImage.jsx';
import { downloadFile, downloadPDF } from '../lib/fileUtil.js';

const CATEGORIES = ['Academic','Exam','Events','Hostel','Placement','General'];
const DEPARTMENTS = ['all','CS','Mechanical','Civil','Electrical'];

function NoticeCard({ notice, user, onViewClick }) {
	const [liked, setLiked] = useState(notice.user_liked || false);
	const [likeCount, setLikeCount] = useState(notice.like_count || 0);
	
	// Separate images and other attachments
	const images = notice.attachments?.filter(a => a.file_type?.startsWith('image/')) || [];
	const files = notice.attachments?.filter(a => !a.file_type?.startsWith('image/')) || [];
	
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
		<div className="card notice-card" style={{ overflow: 'visible' }}>
			{/* IMAGES FIRST - WhatsApp Style - Fixed Layout */}
			{images.length > 0 && (
				<div style={{ 
					marginBottom: 16, 
					borderRadius: 4,
					overflow: 'hidden'
				}}>
					{images.map((img, idx) => (
						<div key={img.id} style={{ 
							marginBottom: idx < images.length - 1 ? 8 : 0,
							overflow: 'hidden', 
							borderRadius: 4,
							backgroundColor: '#f0f0f0'
						}}>
							<SecureImage 
								filename={img.filename}
								alt={img.original_filename}
								style={{ 
									width: '100%', 
									height: 'auto',
									minHeight: 180,
									maxHeight: 350,
									objectFit: 'cover',
									display: 'block'
								}} 
								onError={(e) => {
									console.error('Image failed to load:', img.filename);
									e.target.style.display = 'none';
								}}
							/>
						</div>
					))}
				</div>
			)}
			
			{/* HEADER - Category and Department */}
			<div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
				<div className="badge blue">{notice.category}</div>
				<div className="badge cyan">{notice.department}</div>
			</div>
			
			{/* TITLE */}
			<div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{notice.title}</div>
			
			{/* METADATA */}
			<div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
				By {notice.author_name} • {new Date(notice.created_at).toLocaleString()}
			</div>
			
			{/* CONTENT PREVIEW */}
			<div style={{ marginBottom: 12, lineHeight: 1.5 }}>
				{notice.content.slice(0, 140)}{notice.content.length > 140 ? '…' : ''}
			</div>
			
			{/* OTHER FILES */}
			{files.length > 0 && (
				<div style={{ marginBottom: 12, padding: '8px', backgroundColor: '#f5f5f5', borderRadius: 4 }}>
					<div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>📎 {files.length} file(s) attached</div>
					{files.slice(0, 2).map(file => (
						<div key={file.id} style={{ marginBottom: 4, fontSize: 12 }}>
							<button 
								onClick={(e) => {
									e.stopPropagation();
									downloadFile(file.filename, file.original_filename);
								}} 
								style={{ 
									background: 'none', 
									border: 'none', 
									color: '#1976d2', 
									textDecoration: 'none',
									cursor: 'pointer',
									padding: 0,
									font: 'inherit'
								}}
							>
								📎 {file.original_filename}
							</button>
						</div>
					))}
					{files.length > 2 && <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>+{files.length - 2} more files</div>}
				</div>
			)}
			
			{/* ACTION BUTTONS */}
			<div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
				<div className="row" style={{ gap: 8 }}>
					<button className="btn ghost" onClick={handleLike} disabled={!user} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px' }}>
						{liked ? '❤️' : '🤍'} {likeCount}
					</button>
					<button 
						className="btn" 
						onClick={() => downloadPDF(notice.id, notice.title)}
						style={{ padding: '6px 12px', fontSize: 13 }}
					>
						📥 PDF
					</button>
				</div>
			<button className="btn" onClick={() => onViewClick(notice)} style={{ padding: '6px 12px' }}>
				👁️ View Details
			</button>
			</div>
		</div>
	);
}

export default function NoticeBoardPage({ user }) {
	const [q, setQ] = useState('');
	const [category, setCategory] = useState('');
	const [department, setDepartment] = useState('');
	const [page, setPage] = useState(1);
	const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 10 });
	const [selectedNotice, setSelectedNotice] = useState(null);
	const pageCount = useMemo(() => Math.max(1, Math.ceil(data.total / data.pageSize)), [data]);
	
	useEffect(() => {
		const controller = new AbortController();
		
		// Build params object with only defined values
		const params = {
			pageSize: 9,
			approved: '1',
			page
		};
		
		// Only add filter params if they have values
		if (q) params.q = q;
		if (category) params.category = category;
		if (department) params.department = department;
		
		console.log('Fetching notices with params:', params);
		
		apiGet('/notices', params)
			.then(d => {
				console.log('Received notices:', d);
				d.items.forEach(notice => {
					console.log(`Notice ${notice.id} (${notice.title}):`, {
						approved: notice.approved,
						department: notice.department,
						attachmentCount: notice.attachments?.length || 0,
						attachments: notice.attachments
					});
				});
				setData(d);
			})
			.catch(err => {
				console.error('Error fetching notices:', err);
				setData({ items: [], total: 0, page: 1, pageSize: 10 });
			});
		
		return () => controller.abort();
	}, [q, category, department, page]);
	
	return (
		<>
			{/* Header with Account Switcher */}
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				marginTop: '16px',
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
					📰 Notice Board
				</h1>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<AccountSwitcher />
					<Link
						to="/"
						className="btn"
						style={{
							textDecoration: 'none',
							display: 'inline-flex',
							alignItems: 'center',
							padding: '10px 16px',
							fontSize: '14px',
							fontWeight: '600'
						}}
						onClick={() => {
							localStorage.removeItem('auth');
							sessionStorage.clear();
						}}
					>
						🚪 Logout
					</Link>
				</div>
			</div>

			<div className="grid" style={{ marginTop: 16 }}>
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
			<div className="grid">
				{data.items && data.items.length > 0 ? (
					data.items.map(n => <NoticeCard key={n.id} notice={n} user={user} onViewClick={setSelectedNotice} />)
				) : (
					<div className="card panel" style={{ gridColumn: 'span 12', textAlign: 'center', padding: 40 }}>
						<div className="muted">No notices found matching your filters.</div>
					</div>
				)}
			</div>
			<div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
				<button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
				<div className="muted" style={{ padding: '8px 12px' }}>Page {page} / {pageCount}</div>
				<button className="btn" onClick={() => setPage(p => Math.min(pageCount, p + 1))} disabled={page >= pageCount}>Next</button>
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


