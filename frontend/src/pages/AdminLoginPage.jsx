import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storeAuth, clearAuth } from '../lib/auth.js';

export default function AdminLoginPage({ onLogin }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState('admin');
	const [error, setError] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();

	// Clear any existing auth data when login page loads
	useEffect(() => {
		clearAuth();
		localStorage.clear();
		setError('');
		// Don't auto-fill - let users enter their credentials
		setEmail('');
		setPassword('');
		setRole('admin');
	}, []);

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		if (!email || !password) {
			setError('Please enter both email and password');
			return;
		}
		try {
			// Use proxy in dev mode, or full URL in production
			const apiUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
			const res = await fetch(`${apiUrl}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, role: 'admin' })
			});
			const contentType = res.headers.get('content-type');
			const isJson = contentType && contentType.includes('application/json');
			
			if (!res.ok) {
				let errorMsg = 'Login failed';
				if (isJson) {
					try {
						const errorData = await res.json();
						errorMsg = errorData.error || errorData.message || errorMsg;
					} catch {
						errorMsg = 'Invalid response format';
					}
				} else {
					try {
						errorMsg = await res.text() || errorMsg;
					} catch {
						errorMsg = `HTTP ${res.status}: ${res.statusText}`;
					}
				}
				throw new Error(errorMsg);
			}
			
			if (!isJson) {
				throw new Error('Invalid response format from server');
			}
			
			const data = await res.json();
			if (!data.user || !data.token) {
				throw new Error('Invalid response from server');
			}
			
			// Verify user is admin
			if (data.user.role !== 'admin') {
				throw new Error('This account is not an admin account. Please use the Faculty & Student login.');
			}
			
			// Store auth data in a consistent format
			const authData = {
				token: data.token,
				user: data.user
			};
			storeAuth(authData);
			onLogin(authData);
			// Redirect to dashboard
			navigate('/dashboard');
		} catch (err) {
			console.error('Login error:', err);
			if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
				setError('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
			} else {
				setError(err.message || 'Invalid admin credentials. Please check your email and password.');
			}
		}
	}
	return (
		<div className="grid" style={{ marginTop: 24 }}>
			<div className="card panel" style={{ gridColumn: 'span 12', maxWidth: 520, margin: '0 auto' }}>
				<div className="section-title">Admin Login</div>
				<div className="spacer" />
				<form onSubmit={handleSubmit}>
				<div style={{ marginBottom: '20px', textAlign: 'center' }}>
					<h3>Admin Portal</h3>
				</div>
				<div className="spacer" />
				<input className="input" placeholder="Email (e.g., admin@tezpuruniversity.ac.in)" value={email} onChange={e => setEmail(e.target.value)} />
					<div className="spacer" />
					<div style={{ position: 'relative', marginBottom: 12 }}>
						<input
							className="input"
							placeholder="Password"
							type={showPassword ? 'text' : 'password'}
							value={password}
							onChange={e => setPassword(e.target.value)}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							style={{
								position: 'absolute',
								right: 12,
								top: '50%',
								transform: 'translateY(-50%)',
								background: 'none',
								border: 'none',
								cursor: 'pointer',
								fontSize: 18,
								padding: 4
							}}
						>
							{showPassword ? '👁️' : '👁️‍🗨️'}
						</button>
					</div>
					<button className="btn primary" type="submit">Login</button>
					{error && <div className="muted" style={{ marginTop: 8, color: '#d32f2f', fontWeight: 500 }}>{error}</div>}
					<div className="muted" style={{ marginTop: 12, textAlign: 'center' }}>
						Don't have an account?{' '}
						<Link to="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>Sign up here</Link>
					</div>
					<div className="muted" style={{ marginTop: 12, textAlign: 'center' }}>
						Forgot your password?{' '}
						<Link to="/forgot-password" style={{ color: '#1976d2', textDecoration: 'none' }}>Reset it here</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
