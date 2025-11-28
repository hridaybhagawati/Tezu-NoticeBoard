import { useNavigate } from 'react-router-dom';

export default function RoleSelectionPage() {
	const navigate = useNavigate();

	return (
		<div style={{ padding: 12, minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
			<div style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
				<div style={{ textAlign: 'center', marginBottom: 48 }}>
					<h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Tezpur University</h1>
					<p style={{ fontSize: 18, color: '#6b7280', marginBottom: 8 }}>Smart Campus Notice Board</p>
					<p style={{ fontSize: 14, color: '#9ca3af' }}>Select your access level to continue</p>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 32 }}>
					{/* Admin Portal */}
					<div
						onClick={() => navigate('/admin-login')}
						style={{
							padding: 32,
							borderRadius: 16,
							border: '2px solid #e5e7eb',
							background: '#fff',
							cursor: 'pointer',
							transition: 'all 0.3s ease',
							boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = '#dc2626';
							e.currentTarget.style.boxShadow = '0 10px 24px rgba(220,38,38,0.15)';
							e.currentTarget.style.transform = 'translateY(-2px)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = '#e5e7eb';
							e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						<div style={{ fontSize: 48, marginBottom: 16 }}>👨‍💼</div>
						<h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>Admin Portal</h2>
						<p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
							Administrative access to create, manage, and publish notices for the entire campus. Full system control and analytics.
						</p>
						<button
							onClick={(e) => {
								e.stopPropagation();
								navigate('/admin-login');
							}}
							style={{
								marginTop: 16,
								padding: '12px 24px',
								borderRadius: 8,
								border: 'none',
								background: '#dc2626',
								color: 'white',
								fontWeight: 600,
								cursor: 'pointer',
								fontSize: 14
							}}
						>
							Admin Login
						</button>
					</div>

					{/* Teacher & Student Portal */}
					<div
						onClick={() => navigate('/login')}
						style={{
							padding: 32,
							borderRadius: 16,
							border: '2px solid #e5e7eb',
							background: '#fff',
							cursor: 'pointer',
							transition: 'all 0.3s ease',
							boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = '#3b82f6';
							e.currentTarget.style.boxShadow = '0 10px 24px rgba(59,130,246,0.15)';
							e.currentTarget.style.transform = 'translateY(-2px)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = '#e5e7eb';
							e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
							e.currentTarget.style.transform = 'translateY(0)';
						}}
					>
						<div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
						<h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>Faculty & Students</h2>
						<p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
							Access for teachers and students to view notices, announcements, and important campus information.
						</p>
						<button
							onClick={(e) => {
								e.stopPropagation();
								navigate('/login');
							}}
							style={{
								marginTop: 16,
								padding: '12px 24px',
								borderRadius: 8,
								border: 'none',
								background: '#3b82f6',
								color: 'white',
								fontWeight: 600,
								cursor: 'pointer',
								fontSize: 14
							}}
						>
							Faculty & Student Login
						</button>
					</div>
				</div>

				<div style={{ textAlign: 'center', paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
					<p style={{ fontSize: 14, color: '#6b7280' }}>
						Don't have an account? 
						<button
							onClick={() => navigate('/register')}
							style={{
								background: 'none',
								border: 'none',
								color: '#3b82f6',
								fontWeight: 600,
								cursor: 'pointer',
								marginLeft: 4,
								fontSize: 14
							}}
						>
							Create Account
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}
