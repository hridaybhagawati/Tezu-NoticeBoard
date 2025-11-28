import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export default function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const navigate = useNavigate();

	const token = searchParams.get('token');

	useEffect(() => {
		if (!token) {
			setError('Invalid or missing reset token');
		}
	}, [token]);

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		setSuccess(false);

		if (!password || !confirmPassword) {
			setError('Please fill in all fields');
			return;
		}

		if (password.length < 6) {
			setError('Password must be at least 6 characters long');
			return;
		}

		if (password !== confirmPassword) {
			setError('Passwords do not match');
			return;
		}

		setLoading(true);
		try {
			const apiUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
			const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, newPassword: password })
			});

			const contentType = res.headers.get('content-type');
			const isJson = contentType && contentType.includes('application/json');

			if (!isJson) {
				throw new Error('Invalid response format from server');
			}

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to reset password');
			}

			setSuccess(true);
			setPassword('');
			setConfirmPassword('');

			// Redirect to login after 2 seconds
			setTimeout(() => {
				navigate('/login');
			}, 2000);
		} catch (err) {
			setError(err.message || 'An error occurred. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	if (!token) {
		return (
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
				<div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
					<h1 style={{ color: '#dc2626', marginBottom: '20px' }}>Invalid Link</h1>
					<p style={{ color: '#6b7280', marginBottom: '30px' }}>The password reset link is invalid or has expired.</p>
					<Link
						to="/forgot-password"
						style={{
							background: 'linear-gradient(90deg, rgb(30, 58, 138), rgb(59, 130, 246))',
							color: 'white',
							padding: '12px 24px',
							textDecoration: 'none',
							borderRadius: '8px',
							display: 'inline-block',
							fontWeight: '600',
							fontSize: '14px'
						}}
					>
						Request New Reset Link
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
			<div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '40px', maxWidth: '400px', width: '100%' }}>
				<h1 style={{ textAlign: 'center', color: '#1e3a8a', marginBottom: '10px', fontSize: '28px' }}>Reset Password</h1>
				<p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '30px', fontSize: '14px' }}>
					Enter your new password below
				</p>

				{success ? (
					<div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#166534' }}>
						<div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>✅ Password Reset Successful!</div>
						<p style={{ margin: '0', fontSize: '14px' }}>Redirecting to login...</p>
					</div>
				) : (
					<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						<div>
							<label style={{ display: 'block', marginBottom: '6px', color: '#1f2937', fontSize: '13px', fontWeight: '600' }}>New Password</label>
							<div style={{ position: 'relative' }}>
								<input
									type={showPassword ? 'text' : 'password'}
									placeholder="Enter new password (min 6 characters)"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									style={{
										width: '100%',
										padding: '12px',
										paddingRight: '40px',
										border: '1px solid #e5e7eb',
										borderRadius: '8px',
										fontSize: '14px',
										boxSizing: 'border-box',
										fontFamily: 'Inter, system-ui'
									}}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									style={{
										position: 'absolute',
										right: '12px',
										top: '50%',
										transform: 'translateY(-50%)',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										fontSize: '18px',
										padding: '4px'
									}}
								>
									{showPassword ? '👁️' : '👁️‍🗨️'}
								</button>
							</div>
						</div>

						<div>
							<label style={{ display: 'block', marginBottom: '6px', color: '#1f2937', fontSize: '13px', fontWeight: '600' }}>Confirm Password</label>
							<div style={{ position: 'relative' }}>
								<input
									type={showConfirmPassword ? 'text' : 'password'}
									placeholder="Confirm your password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									style={{
										width: '100%',
										padding: '12px',
										paddingRight: '40px',
										border: '1px solid #e5e7eb',
										borderRadius: '8px',
										fontSize: '14px',
										boxSizing: 'border-box',
										fontFamily: 'Inter, system-ui'
									}}
								/>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									style={{
										position: 'absolute',
										right: '12px',
										top: '50%',
										transform: 'translateY(-50%)',
										background: 'none',
										border: 'none',
										cursor: 'pointer',
										fontSize: '18px',
										padding: '4px'
									}}
								>
									{showConfirmPassword ? '👁️' : '👁️‍🗨️'}
								</button>
							</div>
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
							{loading ? 'Resetting...' : 'Reset Password'}
						</button>
					</form>
				)}

				<div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
					<Link
						to="/login"
						style={{
							color: '#6b7280',
							textDecoration: 'none',
							transition: 'color 0.2s',
							display: 'inline-block'
						}}
						onMouseEnter={(e) => (e.target.style.color = '#1e3a8a')}
						onMouseLeave={(e) => (e.target.style.color = '#6b7280')}
					>
						← Back to Login
					</Link>
				</div>
			</div>
		</div>
	);
}
