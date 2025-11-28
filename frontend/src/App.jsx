import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import RoleSelectionPage from './pages/RoleSelectionPage.jsx';
import RoleRegistrationPage from './pages/RoleRegistrationPage.jsx';
import StudentTeacherLoginPage from './pages/StudentTeacherLoginPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import NoticeBoardPage from './pages/NoticeBoardPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreateNoticePage from './pages/CreateNoticePage.jsx';
import DeleteAccountPage from './pages/DeleteAccountPage.jsx';
import { getStoredAuth, clearAuth } from './lib/auth.js';

function Navbar({ user, onLogout, isRegisterPage, currentPath }) {
	const [showUserMenu, setShowUserMenu] = useState(false);
	const isHomePage = window.location.pathname === '/';
	const isDashboard = currentPath === '/dashboard';
	const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/admin-login';
	const isAuthPage = isLoginPage || isRegisterPage || window.location.pathname === '/signup' || window.location.pathname === '/forgot-password' || window.location.pathname === '/reset-password';
	const showBackButton = !isHomePage && !user;
	
	return (
		<nav className="navbar">
			<div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
					{showBackButton && (
						<Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: isDashboard ? '4px' : '8px', textDecoration: 'none', color: 'white', fontWeight: '600', fontSize: isDashboard ? '13px' : '15px', padding: isDashboard ? '8px 12px' : '14px 20px', borderRadius: '12px', background: 'linear-gradient(90deg, rgb(107, 91, 255), rgb(94, 199, 255))', cursor: 'pointer', boxShadow: 'rgba(94, 199, 255, 0.18) 0px 10px 24px', transition: '0.3s' }}>
							<span style={{ fontSize: isDashboard ? 14 : 18 }}>←</span>
							{!isDashboard && <span>Back</span>}
						</Link>
					)}
					{user && !isAuthPage && (
						<div 
							style={{ 
								display: 'flex', 
								alignItems: 'center', 
								gap: '8px', 
								paddingRight: '16px',
								cursor: 'pointer',
								position: 'relative'
							}}
							onClick={() => setShowUserMenu(!showUserMenu)}
						>
							<div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, rgb(107, 91, 255), rgb(94, 199, 255))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>
								{user.name.charAt(0).toUpperCase()}
							</div>
							<div style={{ textAlign: 'left' }}>
								<div style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
									{user.name}
								</div>
								<div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'capitalize' }}>
									{user.role === 'admin' ? '👨‍💼 Admin' : user.role === 'teacher' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
								</div>
							</div>
							{showUserMenu && (
								<>
									{/* Overlay to close menu when clicked outside */}
									<div
										onClick={() => setShowUserMenu(false)}
										style={{
											position: 'fixed',
											top: 0,
											left: 0,
											right: 0,
											bottom: 0,
											zIndex: 999
										}}
									/>
									<div style={{
										position: 'absolute',
										top: '100%',
										left: 0,
										marginTop: '8px',
										background: 'white',
										borderRadius: '12px',
										boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
										zIndex: 1000,
										minWidth: '200px',
										overflow: 'hidden'
									}}>
										<Link 
											to="/delete-account"
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '10px',
												padding: '12px 16px',
												color: '#dc2626',
												textDecoration: 'none',
												fontSize: '14px',
												fontWeight: '500',
												borderBottom: '1px solid #f3f4f6',
												transition: 'background 0.2s',
												cursor: 'pointer'
											}}
											onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
											onMouseLeave={(e) => e.target.style.background = 'transparent'}
											onClick={() => setShowUserMenu(false)}
										>
											<span>🗑️</span> Delete Account
										</Link>
										<button 
											onClick={() => {
												setShowUserMenu(false);
												onLogout();
											}}
											style={{
												width: '100%',
												display: 'flex',
												alignItems: 'center',
												gap: '10px',
												padding: '12px 16px',
												background: 'transparent',
												border: 'none',
												color: '#1f2937',
												textDecoration: 'none',
												fontSize: '14px',
												fontWeight: '500',
												cursor: 'pointer',
												transition: 'background 0.2s',
												textAlign: 'left'
											}}
											onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
											onMouseLeave={(e) => e.target.style.background = 'transparent'}
										>
											<span>👋</span> Logout
										</button>
									</div>
								</>
							)}
						</div>
					)}
				</div>
				<div className="brand">
					<img className="logo-img" src="/tezpur-logo.png" alt="Tezpur University Logo" style={{ width: 50, height: 50 }} />
					<div className="title">
						<div>Tezpur University</div>
						<div className="muted" style={{ fontSize: 12 }}>Smart Campus Notice Board</div>
					</div>
				</div>
				<div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
				</div>
			</div>
		</nav>
	);
}

function Footer() {
	return (
		<footer className="footer">
			<div className="container">
				<div style={{ fontSize: 20, fontWeight: 600 }}>Tezpur University</div>
			</div>
		</footer>
	);
}

export default function App() {
	const navigate = useNavigate();
	const [auth, setAuth] = useState(() => {
		// Clear any invalid auth data on startup
		const stored = getStoredAuth();
		if (!stored) {
			localStorage.clear();
		}
		return stored;
	});
	
	// Auto-logout on invalid auth
	useEffect(() => {
		if (!auth) {
			localStorage.clear();
			if (window.location.pathname !== '/' && 
				window.location.pathname !== '/login' && 
				window.location.pathname !== '/admin-login' &&
				window.location.pathname !== '/register' &&
				window.location.pathname !== '/signup' &&
				window.location.pathname !== '/forgot-password' &&
				!window.location.pathname.startsWith('/reset-password')) {
				navigate('/');
			}
		}
	}, [auth, navigate]);
	const user = auth?.user ?? null;
	useEffect(() => {
		// sync auth across tabs
		const onStorage = () => {
			const stored = getStoredAuth();
			setAuth(stored);
		};
		window.addEventListener('storage', onStorage);
		return () => window.removeEventListener('storage', onStorage);
	}, []);
	function handleLogout() {
		// Clear all auth data
		clearAuth();
		setAuth(null);
		// Clear localStorage
		localStorage.clear();
		// Force reload to clear any cached states
		window.location.href = '/';
	}
	return (
		<>
			<Navbar user={user} onLogout={handleLogout} isRegisterPage={window.location.pathname === '/register'} currentPath={window.location.pathname} />
			<div className="container">
				<Routes>
					<Route 
						path="/" 
						element={
							user ? (
								<NoticeBoardPage user={user} />
							) : (
								<RoleSelectionPage />
							)
						} 
					/>
				<Route path="/login" element={<StudentTeacherLoginPage onLogin={setAuth} />} />
				<Route path="/register" element={<RoleRegistrationPage />} />
				<Route path="/signup" element={<SignupPage />} />
				<Route path="/admin-login" element={<AdminLoginPage onLogin={setAuth} />} />
					<Route path="/forgot-password" element={<ForgotPasswordPage />} />
					<Route path="/reset-password" element={<ResetPasswordPage />} />
					<Route
						path="/delete-account"
						element={
							user ? <DeleteAccountPage /> : <Navigate to="/login" />
						}
					/>
					<Route
						path="/dashboard"
						element={
							user && (user.role === 'teacher' || user.role === 'admin')
								? <DashboardPage user={user} />
								: <Navigate to="/login" />
						}
					/>
					<Route
						path="/create-notice"
						element={
							user && (user.role === 'teacher' || user.role === 'admin')
								? <CreateNoticePage user={user} />
								: <Navigate to="/login" />
						}
					/>
				</Routes>
			</div>
			<Footer />
		</>
	);
}


