// services/emailService.js

const EmailTemplate = require('../Email/model');



const createNewOrderEmail = async (emailData) => {
    try {
        const emailTemplate = new EmailTemplate({
            status: 'new_order',
            enable: emailData.enable,
            recipients: emailData.recipients, // Array of user IDs
            subject: emailData.subject,
            emailHeading: emailData.emailHeading,
            additionalContent: emailData.additionalContent,
            emailType: emailData.emailType,
            headerImage: emailData.headerImage,
            footerText: emailData.footerText,
            baseColor: emailData.baseColor,
            backgroundColor: emailData.backgroundColor,
            bodyBackgroundColor: emailData.bodyBackgroundColor,
            bodyTextColor: emailData.bodyTextColor,
            fromName: emailData.fromName,
            fromAddress: emailData.fromAddress,
        });

        // Save the new email template to the database
        const savedTemplate = await emailTemplate.save();
        return savedTemplate;
    } catch (error) {
        throw new Error(`Failed to create new order email setup: ${error.message}`);
    }
};




const updateNewOrderEmail = async (templateId, updateData) => {
    try {
        const updatedTemplate = await EmailTemplate.findByIdAndUpdate(
            templateId,
            updateData,
            { new: true }
        );
        return updatedTemplate;
    } catch (error) {
        throw new Error(`Failed to update the new order email setup: ${error.message}`);
    }
};

module.exports = {
    createNewOrderEmail,
    updateNewOrderEmail,
};
