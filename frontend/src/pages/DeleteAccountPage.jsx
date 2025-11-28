import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredAuth, clearAuth } from '../lib/auth.js';

export default function DeleteAccountPage() {
	const navigate = useNavigate();
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [showDeletedNotification, setShowDeletedNotification] = useState(false);

	const handleDeleteAccount = async () => {
		setError('');
		setLoading(true);

		try {
			const auth = getStoredAuth();
			if (!auth || !auth.token) {
				setError('Authentication required. Please log in again.');
				return;
			}

			const apiUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
			const res = await fetch(`${apiUrl}/api/auth/delete-account`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${auth.token}`
				}
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to delete account');
			}

			// Show success notification and redirect
			clearAuth();
			setShowDeletedNotification(true);
			
			// Redirect after showing notification
			setTimeout(() => {
				window.location.href = '/';
			}, 2000);
		} catch (err) {
			console.error('Delete account error:', err);
			setError(err.message || 'Failed to delete account. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="grid" style={{ marginTop: 24 }}>
			{showDeletedNotification && (
				<div style={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: 'rgba(0, 0, 0, 0.5)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 9999
				}}>
					<div style={{
						backgroundColor: 'white',
						borderRadius: '12px',
						padding: '32px',
						textAlign: 'center',
						maxWidth: 400,
						boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
					}}>
						<div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
						<h2 style={{ color: '#16a34a', marginBottom: 8, fontSize: 20, fontWeight: 700 }}>Account Deleted</h2>
						<p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>Your account has been successfully deleted. Redirecting to home page...</p>
						<button
							className="btn primary"
							onClick={() => {
								window.location.href = '/';
							}}
							style={{ width: '100%' }}
						>
							Go to Home
						</button>
					</div>
				</div>
			)}
			<div className="card panel" style={{ gridColumn: 'span 12', maxWidth: 520, margin: '0 auto' }}>
				<div className="section-title" style={{ color: '#dc2626' }}>Delete Account</div>
				<div className="spacer" />

				{!showConfirmation ? (
					<>
						<p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
							⚠️ <strong>Warning:</strong> This action cannot be undone. Your account and all associated data will be permanently deleted from our system.
						</p>
						<button 
							className="btn" 
							onClick={() => setShowConfirmation(true)}
							style={{ 
								width: '100%', 
								backgroundColor: '#dc2626',
								borderColor: '#dc2626'
							}}
						>
							I Understand, Delete My Account
						</button>
					</>
				) : (
					<>
						<div style={{ 
							backgroundColor: '#fee2e2', 
							border: '1px solid #fecaca',
							borderRadius: '8px',
							padding: '16px',
							marginBottom: '20px'
						}}>
							<p style={{ color: '#7f1d1d', fontWeight: 600, marginBottom: 12 }}>
								Are you absolutely sure?
							</p>
							<p style={{ color: '#991b1b', fontSize: 14, marginBottom: 12 }}>
								This will permanently delete your account and remove all your data. You will not be able to recover this account.
							</p>
							<p style={{ color: '#991b1b', fontSize: 14 }}>
								Type "DELETE" below to confirm:
							</p>
							<input
								type="text"
								placeholder="Type DELETE to confirm"
								style={{
									width: '100%',
									padding: '10px',
									marginTop: '12px',
									border: '1px solid #fca5a5',
									borderRadius: '6px',
									fontFamily: 'monospace',
									fontSize: 14
								}}
								id="confirmationInput"
							/>
						</div>

						{error && (
							<div style={{
								backgroundColor: '#fee2e2',
								color: '#991b1b',
								padding: '12px',
								borderRadius: '8px',
								marginBottom: '16px',
								fontSize: 13
							}}>
								{error}
							</div>
						)}

						<div style={{ display: 'flex', gap: '12px' }}>
							<button
								className="btn"
								onClick={() => setShowConfirmation(false)}
								style={{ flex: 1 }}
								disabled={loading}
							>
								Cancel
							</button>
							<button
								className="btn"
								onClick={() => {
									const input = document.getElementById('confirmationInput');
									if (input?.value === 'DELETE') {
										handleDeleteAccount();
									} else {
										setError('Please type "DELETE" to confirm account deletion');
									}
								}}
								style={{ 
									flex: 1,
									backgroundColor: '#dc2626',
									borderColor: '#dc2626'
								}}
								disabled={loading}
							>
								{loading ? 'Deleting...' : 'Permanently Delete Account'}
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
