import nodemailer from 'nodemailer';

let transporter = null;

export function initEmailService() {
	// Check if email credentials are configured
	const hasGmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
	const hasSmtpConfig = process.env.EMAIL_HOST && process.env.EMAIL_PORT && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

	if (!hasGmailConfig && !hasSmtpConfig) {
		console.warn('⚠️  Email credentials not configured in .env file');
		console.warn('📧 Email notifications will be DISABLED');
		console.warn('📝 To enable, add EMAIL_USER and EMAIL_PASSWORD to .env file');
		console.warn('📖 See EMAIL_SETUP.md for detailed setup instructions');
		return false;
	}

	const emailConfig = {
		service: process.env.EMAIL_SERVICE || 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASSWORD
		}
	};

	// Use custom SMTP if provided
	if (process.env.EMAIL_HOST) {
		emailConfig.host = process.env.EMAIL_HOST;
		emailConfig.port = Number(process.env.EMAIL_PORT || 587);
		emailConfig.secure = process.env.EMAIL_SECURE === 'true'; // true for 465, false for other ports
		delete emailConfig.service;
	}

	try {
		transporter = nodemailer.createTransport(emailConfig);
		console.log('✅ Email service initialized successfully');
		console.log(`📧 Using: ${process.env.EMAIL_SERVICE || 'Gmail'}`);
		return true;
	} catch (err) {
		console.error('❌ Failed to initialize email service:', err.message);
		return false;
	}
}

export async function sendNotificationEmail(recipientEmail, noticeName, noticeTitle, noticeContent, authorName) {
	if (!transporter) {
		console.warn('⚠️  Email service not initialized. Email notification skipped.');
		return false;
	}

	try {
		const mailOptions = {
			from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
			to: recipientEmail,
			subject: `New Notice: ${noticeTitle}`,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
					<div style="background-color: #ffffff; padding: 24px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
						<h2 style="color: #1e3a8a; margin-top: 0;">New Notice Posted</h2>
						
						<p style="color: #4b5563; font-size: 14px;">Dear ${recipientEmail.split('@')[0]},</p>
						
						<p style="color: #4b5563; line-height: 1.6;">
							A new notice has been posted on the Tezpur University Notice Board.
						</p>
						
						<div style="background-color: #f0f4f8; padding: 16px; border-left: 4px solid #0ea5e9; margin: 20px 0; border-radius: 4px;">
							<h3 style="color: #1e3a8a; margin-top: 0; margin-bottom: 8px;">${noticeTitle}</h3>
							<p style="color: #6b7280; font-size: 13px; margin: 0;">Posted by: <strong>${authorName}</strong></p>
						</div>
						
						<div style="margin: 20px 0;">
							<h4 style="color: #1f2937; font-size: 14px;">Notice Content:</h4>
							<p style="color: #4b5563; line-height: 1.6; font-size: 14px;">${noticeContent.substring(0, 200)}${noticeContent.length > 200 ? '...' : ''}</p>
						</div>
						
						<div style="margin-top: 24px; text-align: center;">
							<a href="${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}" style="display: inline-block; background-color: #1e3a8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
								View on Notice Board
							</a>
						</div>
						
						<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
						
						<p style="color: #9ca3af; font-size: 12px; margin: 0;">
							This is an automated notification from Tezpur University Smart Campus Notice Board. 
							Please do not reply to this email.
						</p>
					</div>
				</div>
			`,
			text: `New Notice: ${noticeTitle}\n\n${noticeContent}\n\nVisit the notice board to view full details.`
		};

		const info = await transporter.sendMail(mailOptions);
		console.log(`✅ Email sent to ${recipientEmail}:`, info.messageId);
		return true;
	} catch (err) {
		console.error(`❌ Failed to send email to ${recipientEmail}:`, err.message);
		return false;
	}
}

export async function sendBulkNotificationEmails(emails, noticeTitle, noticeContent, authorName) {
	if (!transporter) {
		console.warn('⚠️  Email service not initialized. Email notifications skipped.');
		return { sent: 0, failed: 0 };
	}

	let sent = 0;
	let failed = 0;

	// Send emails to all users (batch)
	const results = await Promise.allSettled(
		emails.map(email => sendNotificationEmail(email, 'Notice', noticeTitle, noticeContent, authorName))
	);

	results.forEach((result, index) => {
		if (result.status === 'fulfilled' && result.value) {
			sent++;
		} else {
			failed++;
			console.error(`❌ Failed to send email to user ${index + 1}`);
		}
	});

	console.log(`📧 Bulk email: ${sent} sent, ${failed} failed out of ${emails.length} total`);
	return { sent, failed };
}

export async function sendPasswordResetEmail(recipientEmail, resetLink) {
	if (!transporter) {
		console.warn('⚠️  Email service not initialized. Password reset email skipped.');
		return false;
	}

	try {
		const mailOptions = {
			from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
			to: recipientEmail,
			subject: 'Password Reset Request - Tezpur University Notice Board',
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
					<div style="background-color: #ffffff; padding: 24px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
						<h2 style="color: #1e3a8a; margin-top: 0;">Password Reset Request</h2>
						
						<p style="color: #4b5563; font-size: 14px;">Hello,</p>
						
						<p style="color: #4b5563; line-height: 1.6;">
							We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
						</p>
						
						<p style="color: #4b5563; line-height: 1.6;">
							To reset your password, click the button below. The link will expire in 1 hour.
						</p>
						
						<div style="text-align: center; margin: 30px 0;">
							<a href="${resetLink}" style="background-color: #1e3a8a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
								Reset Password
							</a>
						</div>
						
						<p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
							Or copy this link in your browser: <br />
							<span style="word-break: break-all; color: #0ea5e9;">${resetLink}</span>
						</p>
						
						<div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px;">
							<p style="color: #6b7280; font-size: 12px; margin: 0;">
								This is an automated message from Tezpur University Notice Board. Please do not reply to this email.
							</p>
						</div>
					</div>
				</div>
			`
		};

		await transporter.sendMail(mailOptions);
		console.log(`✅ Password reset email sent to ${recipientEmail}`);
		return true;
	} catch (err) {
		console.error('Error sending password reset email:', err.message);
		return false;
	}
}

