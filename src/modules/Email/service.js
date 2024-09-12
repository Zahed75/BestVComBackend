const EmailTemplate = require('../Email/model');
const UserModel = require('../User/model'); // Assuming user emails are stored here
const nodemailer = require('nodemailer'); // Import Nodemailer

// Configure Nodemailer transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service provider
    auth: {
        user: 'tech.syscomatic@gmail.com',
        pass: 'nfkb rcqg wdez ionc',
    },
});

const sendEmail = async (recipient, subject, htmlContent, fromName, fromAddress) => {
    try {
        // Convert recipient to a string if it's an array
        if (Array.isArray(recipient)) {
            recipient = recipient.join(','); // Join array into a comma-separated string
        }

        // Check if recipient is a valid string
        if (typeof recipient !== 'string' || recipient.trim() === '') {
            throw new Error('Recipient email is missing or invalid');
        }

        // Prepare the email options
        const mailOptions = {
            from: `${fromName} <${fromAddress}>`,
            to: recipient, // Ensure this is a valid string
            subject: subject,
            html: htmlContent,
        };

        // Send the email using Nodemailer
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email');
    }
};


// Create and send order emails
const createAndSendOrderEmails = async (orderData) => {
    try {
        // Fetch the email template for new orders
        const template = await EmailTemplate.findOne({ status: 'new_order', enable: true });

        if (!template) {
            throw new Error('Email template for new orders not found');
        }

        // Log to check if the template has recipients
        console.log('Template Recipients:', template.recipients);

        // Fetch recipient email addresses based on user IDs
        const recipients = await UserModel.find({
            _id: { $in: template.recipients.map(r => r._id) },
        }).select('email -_id'); // Fetch only the email field

        // Log to check the fetched recipients
        console.log('Fetched Recipients:', recipients);

        // Extract emails from recipients
        const recipientEmails = recipients.map(recipient => recipient.email);

        // Ensure there are recipient emails
        if (recipientEmails.length === 0) {
            throw new Error('No valid recipient email addresses found');
        }

        // Prepare the email HTML content with order details
        const htmlContent = `
            <h1 style="color:${template.baseColor};">${template.emailHeading}</h1>
            <p>${template.additionalContent}</p>
            <img src="${template.headerImage}" alt="Header Image" />
            
            <h2>Order Information</h2>
            <p>Order ID: ${orderData.orderId}</p>
            <p>Total Cost: ${orderData.totalCost}</p>
            
            <h3>Items:</h3>
            <ul>
                ${orderData.items.map(item => `
                    <li>${item.name} - ${item.quantity} x ${item.price}</li>
                `).join('')}
            </ul>
            
            <p style="color:${template.bodyTextColor}; background-color:${template.bodyBackgroundColor};">${template.footerText}</p>
        `;

        // Send an email to each recipient
        for (const email of recipientEmails) {
            console.log(`Sending email to: ${email}`); // Log email addresses before sending
            await sendEmail(email, template.subject, htmlContent, template.fromName, template.fromAddress);
        }

        return { success: true, message: 'Order emails sent successfully' };
    } catch (error) {
        console.error('Failed to send order emails:', error); // Log the full error
        throw new Error(`Failed to send order emails: ${error.message}`);
    }
};

// Update the new order email template
const updateNewOrderEmail = async (templateId, updateData) => {
    try {
        const updatedTemplate = await EmailTemplate.findByIdAndUpdate(templateId, updateData, { new: true });

        // Fetch recipient email addresses based on user IDs
        const recipients = await UserModel.find({
            _id: { $in: updateData.recipients },
        }).select('email -_id');

        const recipientEmails = recipients.map((recipient) => recipient.email);

        if (recipientEmails.length === 0) {
            throw new Error('No valid recipient email addresses found');
        }

        // Convert array of emails to a comma-separated string
        const recipientEmailString = recipientEmails.join(',');

        // Prepare the updated email HTML content
        const htmlContent = `
            <h1 style="color:${updateData.baseColor};">${updateData.emailHeading}</h1>
            <p>${updateData.additionalContent}</p>
            <img src="${updateData.headerImage}" alt="Header Image" />
            <p style="color:${updateData.bodyTextColor}; background-color:${updateData.bodyBackgroundColor};">${updateData.footerText}</p>
        `;

        // Send the updated email
        await sendEmail(recipientEmailString, updateData.subject, htmlContent, updateData.fromName, updateData.fromAddress);

        return updatedTemplate;
    } catch (error) {
        throw new Error(`Failed to update the new order email setup: ${error.message}`);
    }
};

module.exports = {
    createAndSendOrderEmails,
    updateNewOrderEmail,
    sendEmail
};
