import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setSuccess(false);

		if (!email) {
			setError('Please enter your email address');
			return;
		}

		setLoading(true);
		try {
			const apiUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
			const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const contentType = res.headers.get('content-type');
			const isJson = contentType && contentType.includes('application/json');

			if (!isJson) {
				throw new Error('Server returned invalid response');
			}

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to send reset link');
			}

			setSuccess(true);
			setEmail('');
		} catch (err) {
			console.error('Forgot password error:', err);
			setError(err.message || 'An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
			<div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '40px', maxWidth: '400px', width: '100%' }}>
				<h1 style={{ textAlign: 'center', color: '#1e3a8a', marginBottom: '10px', fontSize: '28px' }}>Forgot Password?</h1>
				<p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '30px', fontSize: '14px' }}>
					Enter your email address and we'll send you a link to reset your password
				</p>

				{success ? (
					<div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: '#166534', fontSize: '14px' }}>
						✅ Password reset link has been sent to your email. Check your inbox (and spam folder) for further instructions.
					</div>
				) : (
					<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div>
							<input
								type="email"
								placeholder="Enter your email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #e5e7eb',
									borderRadius: '8px',
									fontSize: '14px',
									boxSizing: 'border-box',
									fontFamily: 'Inter, system-ui'
								}}
							/>
						</div>

						{error && (
							<div style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center', background: '#fee2e2', padding: '8px', borderRadius: '6px' }}>
								{error}
							</div>
						)}

						<button
							type="submit"
							disabled={loading}
							style={{
								background: loading ? '#9ca3af' : 'linear-gradient(90deg, rgb(30, 58, 138), rgb(59, 130, 246))',
								color: 'white',
								padding: '12px 16px',
								border: 'none',
								borderRadius: '8px',
								fontSize: '14px',
								fontWeight: '600',
								cursor: loading ? 'not-allowed' : 'pointer',
								transition: 'opacity 0.2s'
							}}
						>
							{loading ? 'Sending...' : 'Send Reset Link'}
						</button>
					</form>
				)}

				<div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
					<p style={{ color: '#6b7280', margin: '0 0 10px 0' }}>Remember your password?</p>
					<Link
						to="/login"
						style={{
							color: '#1e3a8a',
							textDecoration: 'none',
							fontWeight: '600',
							transition: 'color 0.2s'
						}}
						onMouseEnter={(e) => (e.target.style.color = '#3b82f6')}
						onMouseLeave={(e) => (e.target.style.color = '#1e3a8a')}
					>
						Back to Login
					</Link>
				</div>

				<div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
					<Link
						to="/role-selection"
						style={{
							color: '#6b7280',
							textDecoration: 'none',
							transition: 'color 0.2s',
							display: 'inline-block'
						}}
						onMouseEnter={(e) => (e.target.style.color = '#1e3a8a')}
						onMouseLeave={(e) => (e.target.style.color = '#6b7280')}
					>
						← Back to Role Selection
					</Link>
				</div>
			</div>
		</div>
	);
}
