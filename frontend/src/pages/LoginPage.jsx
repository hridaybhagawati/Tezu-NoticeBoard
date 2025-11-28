import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { storeAuth } from '../lib/auth.js';

export default function LoginPage() {
	const navigate = useNavigate();
	const googleButtonRef = useRef(null);

	useEffect(() => {
		// Load Google Sign-In script
		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);

		script.onload = () => {
			if (window.google && googleButtonRef.current) {
				window.google.accounts.id.initialize({
					client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1093743261695-u6h8uaf9m2ohqio4p7s0gq8vipkm2l2g.apps.googleusercontent.com',
					callback: handleGoogleSignIn
				});
				window.google.accounts.id.renderButton(googleButtonRef.current, {
					theme: 'outline',
					size: 'large',
					width: '100%'
				});
			}
		};

		return () => {
			if (document.head.contains(script)) {
				document.head.removeChild(script);
			}
		};
	}, []);

	const handleGoogleSignIn = async (response) => {
		try {
			const apiUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
			const res = await fetch(`${apiUrl}/api/auth/google`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ token: response.credential })
			});

			const data = await res.json();

			if (!res.ok) {
				alert('Google authentication failed: ' + (data.error || 'Unknown error'));
				return;
			}

			// Store auth and redirect
			storeAuth(data.token, data.user);
			navigate('/dashboard');
		} catch (err) {
			console.error('Google sign-in error:', err);
			alert('Failed to sign in with Google');
		}
	};

	const containerStyle = {
		maxWidth: 420,
		margin: '24px auto',
		padding: 28,
		borderRadius: 20,
		background: 'linear-gradient(180deg, #ffffff, #fbfdff)',
		boxShadow: '0 20px 40px rgba(18,24,49,0.08)'
	};

	const heroImgStyle = {
		display: 'block',
		margin: '0 auto 18px',
		width: 160,
		height: 160
	};

	const bigButton = {
		width: '100%',
		padding: '16px 20px',
		borderRadius: 16,
		border: 'none',
		color: 'white',
		fontWeight: 600,
		fontSize: 16,
		background: 'linear-gradient(90deg,#6b5bff,#5ec7ff)',
		boxShadow: '0 10px 24px rgba(94,199,255,0.18)'
	};

	const socialBtn = {
		width: '100%',
		padding: '12px 14px',
		borderRadius: 12,
		border: '1px solid #e6edf3',
		background: '#fff',
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		cursor: 'pointer'
	};

	return (
		<div style={{ padding: 12 }}>
			<div style={containerStyle}>
				<div style={{ textAlign: 'center' }}>
					<svg style={heroImgStyle} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
						<defs>
							<linearGradient id="g1" x1="0" x2="1">
								<stop offset="0" stopColor="#6b5bff" />
								<stop offset="1" stopColor="#5ec7ff" />
							</linearGradient>
						</defs>
						<rect x="0" y="0" width="200" height="200" rx="24" fill="url(#g1)" opacity="0.04" />
						<g transform="translate(40,30)">
							<ellipse cx="60" cy="90" rx="52" ry="36" fill="#ecfeff" />
							<rect x="24" y="10" width="72" height="72" rx="20" fill="#c7f8ff" />
							<rect x="32" y="18" width="56" height="48" rx="12" fill="#fff" />
							<circle cx="50" cy="40" r="6" fill="#111827" />
							<circle cx="74" cy="40" r="6" fill="#111827" />
							<rect x="44" y="52" width="24" height="6" rx="3" fill="#111827" opacity="0.9" />
						</g>
					</svg>
					<h2 style={{ margin: '6px 0 6px', fontSize: 22 }}>Let’s Get Started</h2>
					<div className="muted" style={{ marginBottom: 18 }}>All your campus news — organized, fast, and always on time.</div>
				</div>

				<div style={{ marginTop: 8 }}>
					<button style={bigButton} onClick={() => navigate('/login')}> 
						SIGN IN <span style={{ marginLeft: 8 }}>→</span>
					</button>
				</div>

			<div style={{ textAlign: 'center', margin: '14px 0', color: '#9aa6b2' }}>OR</div>

			<div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center' }}></div>				<div style={{ marginTop: 18, textAlign: 'center', fontSize: 14 }}>
					Don't have an account? <a href="/signup" style={{ color: '#4f46e5', fontWeight: 600 }}>Sign up</a>
				</div>
			</div>
		</div>
	);
}


