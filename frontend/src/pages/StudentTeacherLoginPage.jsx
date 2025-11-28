import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storeAuth, clearAuth } from '../lib/auth.js';

export default function StudentTeacherLoginPage({ onLogin }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
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
	}, []);

	async function handleSubmit(e) {
		e.preventDefault();
		setError('');
		if (!email || !password) {
			setError('Please enter both email and password');
			return;
		}
		try {
			console.log('Attempting login with email:', email);
			// Use proxy in dev mode, or full URL in production
			const apiUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
			console.log('API URL:', apiUrl || 'using proxy');
			
			const res = await fetch(`${apiUrl}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
				credentials: 'include'
			});
			
			console.log('Response status:', res.status);
			console.log('Response headers:', res.headers);
			
			const contentType = res.headers.get('content-type');
			const isJson = contentType && contentType.includes('application/json');
			
			if (!res.ok) {
				let errorMsg = 'Login failed';
				if (isJson) {
					try {
						const errorData = await res.json();
						console.log('Error response:', errorData);
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
				console.error('Login error:', errorMsg);
				throw new Error(errorMsg);
			}
			
			if (!isJson) {
				throw new Error('Invalid response format from server');
			}
			
			const data = await res.json();
			console.log('Login successful, user data:', data.user);
			
			if (!data.user || !data.token) {
				throw new Error('Invalid response from server');
			}
			
			// Verify user is teacher or student (not admin)
			if (data.user.role === 'admin') {
				throw new Error('Admin accounts must use the Admin Portal. Please use the Admin Login.');
			}
			
			if (!['teacher', 'student'].includes(data.user.role)) {
				throw new Error('Invalid user role');
			}
			
			// Store auth data in a consistent format
			const authData = {
				token: data.token,
				user: data.user
			};
			storeAuth(authData);
			onLogin(authData);
			// Redirect by role
			if (data.user.role === 'teacher') {
				navigate('/dashboard');
			} else {
				navigate('/');
			}
		} catch (err) {
			console.error('Login error:', err);
			if (err.message.includes('fetch') || err.message.includes('Failed to fetch')) {
				setError('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
			} else {
				setError(err.message || 'Invalid credentials. Please check your email and password.');
			}
		}
	}
	return (
		<div className="grid" style={{ marginTop: 24 }}>
			<div className="card panel" style={{ gridColumn: 'span 12', maxWidth: 520, margin: '0 auto' }}>
				<div className="spacer" />
				<form onSubmit={handleSubmit}>
					<input className="input" placeholder="Email (e.g., student@gmail.com)" value={email} onChange={e => setEmail(e.target.value)} />
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
