import { useEffect, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '../lib/api.js';

function CommentItem({ comment, user, noticeId, onReply, onDelete, onReplySubmit }) {
	const [showReply, setShowReply] = useState(false);
	const [replyText, setReplyText] = useState('');
	const canDelete = user && (user.role === 'admin' || user.role === 'teacher' || comment.user_id === user.id);
	async function handleDelete() {
		if (!confirm('Delete this comment?')) return;
		try {
			await apiDelete(`/feedback/${comment.id}`);
			onDelete(comment.id);
		} catch (err) {
			alert('Failed to delete comment');
		}
	}
	async function handleReplySubmit(e) {
		e.preventDefault();
		if (!replyText.trim()) return;
		try {
			const reply = await apiPost(`/feedback/${noticeId}`, { message: replyText, reply_to: comment.id });
			onReplySubmit(comment.id, reply);
			setReplyText('');
			setShowReply(false);
		} catch (err) {
			alert('Failed to post reply');
		}
	}
	return (
		<div style={{ marginTop: 12, paddingLeft: comment.reply_to ? 24 : 0, borderLeft: comment.reply_to ? '2px solid #e0e0e0' : 'none' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
				<div>
					<div style={{ fontWeight: 600 }}>{comment.user_name} <span className="muted">({comment.user_role})</span></div>
					<div className="muted" style={{ fontSize: 12 }}>{new Date(comment.created_at).toLocaleString()}</div>
				</div>
				{canDelete && (
					<button className="btn ghost" onClick={handleDelete} style={{ fontSize: 12, padding: '4px 8px' }}>Delete</button>
				)}
			</div>
			<div style={{ marginTop: 6 }}>{comment.message}</div>
			{user && !comment.reply_to && (
				<div style={{ marginTop: 8 }}>
					<button className="btn ghost" onClick={() => setShowReply(!showReply)} style={{ fontSize: 12 }}>
						{showReply ? 'Cancel' : 'Reply'}
					</button>
					{showReply && (
						<form onSubmit={handleReplySubmit} style={{ marginTop: 8 }}>
							<input className="input" placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ fontSize: 14 }} />
							<button className="btn primary" type="submit" style={{ marginTop: 4, fontSize: 12 }}>Post Reply</button>
						</form>
					)}
				</div>
			)}
			{comment.replies && comment.replies.length > 0 && (
				<div style={{ marginTop: 8 }}>
					{comment.replies.map(reply => (
						<CommentItem key={reply.id} comment={reply} user={user} noticeId={noticeId} onDelete={onDelete} onReplySubmit={onReplySubmit} />
					))}
				</div>
			)}
		</div>
	);
}

export default function Feedback({ noticeId, user, commentEnabled = true }) {
	const [items, setItems] = useState([]);
	const [message, setMessage] = useState('');
	useEffect(() => {
		apiGet(`/feedback/${noticeId}`).then(setItems).catch(()=>{});
	}, [noticeId]);
	async function submit(e) {
		e.preventDefault();
		if (!user) {
			alert('Please login to post a question.');
			return;
		}
		if (!message.trim()) return;
		try {
			const created = await apiPost(`/feedback/${noticeId}`, { message });
			setItems(prev => [...prev, created]);
			setMessage('');
		} catch (err) {
			alert(err.message || 'Failed to post comment');
		}
	}
	function handleDelete(commentId) {
		setItems(prev => {
			const removeRecursive = (list) => list.filter(c => {
				if (c.id === commentId) return false;
				if (c.replies) c.replies = removeRecursive(c.replies);
				return true;
			});
			return removeRecursive(prev);
		});
	}
	function handleReplySubmit(parentId, reply) {
		setItems(prev => prev.map(c => {
			if (c.id === parentId) {
				return { ...c, replies: [...(c.replies || []), reply] };
			}
			return c;
		}));
	}
	if (!commentEnabled) {
		return (
			<div className="card panel" style={{ marginTop: 8 }}>
				<div className="muted">Comments are disabled for this notice.</div>
			</div>
		);
	}
	return (
		<div className="card panel" style={{ marginTop: 8 }}>
			<div className="section-title">Questions & Replies</div>
			<div className="spacer" />
			<div style={{ display: 'grid', gap: 8 }}>
				{items.map(f => (
					<div key={f.id} className="card panel" style={{ background: '#f9fafb' }}>
						<CommentItem comment={f} user={user} noticeId={noticeId} onDelete={handleDelete} onReplySubmit={handleReplySubmit} />
					</div>
				))}
				{items.length === 0 && <div className="muted">No questions yet. Be the first to ask.</div>}
			</div>
			{user && (
				<>
					<div className="spacer" />
					<form onSubmit={submit} className="row">
						<input className="input" placeholder="Ask a question or request clarification..." value={message} onChange={e=>setMessage(e.target.value)} />
						<button className="btn primary" type="submit">Post</button>
					</form>
				</>
			)}
		</div>
	);
}


