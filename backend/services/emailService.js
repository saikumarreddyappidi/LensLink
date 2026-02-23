// Email Service for LensLink
const nodemailer = require('nodemailer');

// Create transporter - using Gmail SMTP
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS // App password for Gmail
        }
    });
};

// Send welcome email to client
const sendClientWelcomeEmail = async (userEmail, userName) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('📧 Email not configured - skipping welcome email to client');
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"LensLink" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '🎉 Welcome to LensLink - Find Your Perfect Photographer!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">📸 LensLink</h1>
                    </div>
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #1f2937;">Hello ${userName}! 👋</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Thank you for logging in to LensLink! We're excited to have you here.
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            <strong>🌟 Find the best photographers for your special moments:</strong>
                        </p>
                        <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
                            <li>🎭 Browse professional photographers</li>
                            <li>💬 Read reviews and ratings</li>
                            <li>📅 Easy booking system</li>
                            <li>💰 Transparent pricing</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000" style="background: #f97316; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                                Find Photographers Now
                            </a>
                        </div>
                        <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                            © 2026 LensLink. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to client: ${userEmail}`);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('❌ Error sending client welcome email:', error.message);
        return { success: false, message: error.message };
    }
};

// Send welcome email to photographer
const sendPhotographerWelcomeEmail = async (userEmail, userName) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('📧 Email not configured - skipping welcome email to photographer');
            return { success: false, message: 'Email not configured' };
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"LensLink" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '🎉 Welcome to LensLink - Clients Are Waiting For You!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">📸 LensLink</h1>
                    </div>
                    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #1f2937;">Hello ${userName}! 📷</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Thank you for creating your photographer account on LensLink!
                        </p>
                        <p style="color: #10b981; font-size: 18px; font-weight: bold; text-align: center; padding: 20px; background: #ecfdf5; border-radius: 8px;">
                            🎉 Clients are waiting for you! 🎉
                        </p>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            <strong>🚀 Get started and grow your business:</strong>
                        </p>
                        <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
                            <li>✨ Complete your profile</li>
                            <li>📸 Upload your best portfolio photos</li>
                            <li>💰 Set competitive pricing</li>
                            <li>📅 Manage your availability</li>
                            <li>⭐ Build your reputation with reviews</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://localhost:3000" style="background: #10b981; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                                Complete Your Profile
                            </a>
                        </div>
                        <p style="color: #9ca3af; font-size: 14px; text-align: center;">
                            © 2026 LensLink. All rights reserved.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to photographer: ${userEmail}`);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('❌ Error sending photographer welcome email:', error.message);
        return { success: false, message: error.message };
    }
};

// Send email based on user role
const sendWelcomeEmail = async (user) => {
    if (user.role === 'client') {
        return await sendClientWelcomeEmail(user.email, user.name);
    } else if (user.role === 'photographer') {
        return await sendPhotographerWelcomeEmail(user.email, user.name);
    }
    return { success: false, message: 'Unknown role' };
};

module.exports = {
    sendClientWelcomeEmail,
    sendPhotographerWelcomeEmail,
    sendWelcomeEmail
};
