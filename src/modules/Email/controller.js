const express = require('express');
const router = express.Router();
const emailService = require('../Email/service');
const { asyncHandler } = require('../../utility/common');
const { BRANCH_ADMIN,HEAD_OFFICE,MANAGER,CUSTOMER, ADMIN} = require('../../config/constants');



const createNewOrderEmailController = async (req, res) => {
    try {
        // Extract the necessary data from the request body
        const emailData = {
            enable: req.body.enable,
            recipients: req.body.recipients, // Array of recipient user IDs
            subject: req.body.subject,
            emailHeading: req.body.emailHeading,
            additionalContent: req.body.additionalContent,
            emailType: req.body.emailType,
            headerImage: req.body.headerImage,
            footerText: req.body.footerText,
            baseColor: req.body.baseColor,
            backgroundColor: req.body.backgroundColor,
            bodyBackgroundColor: req.body.bodyBackgroundColor,
            bodyTextColor: req.body.bodyTextColor,
            fromName: req.body.fromName,
            fromAddress: req.body.fromAddress,
        };

        // Call the service to create the new order email setup
        const createdTemplate = await emailService.createNewOrderEmail(emailData);

        // Return success response
        return res.status(201).json({
            success: true,
            message: 'New order email setup created successfully',
            data: createdTemplate,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Error creating new order email setup: ${error.message}`,
        });
    }
};


const updateNewOrderEmailController = async (req, res) => {
    try {
        const templateId = req.params.id; // Get the template ID from URL params
        const updateData = req.body; // Get the updated data from the request body

        // Call the service to update the new order email setup
        const updatedTemplate = await emailService.updateNewOrderEmail(templateId, updateData);

        // Return success response
        return res.status(200).json({
            success: true,
            message: 'New order email setup updated successfully',
            data: updatedTemplate,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Error updating new order email setup: ${error.message}`,
        });
    }
};



router.post('/email-setup/new-order', createNewOrderEmailController);

router.put('/email-setup/new-order/:id', updateNewOrderEmailController);




module.exports = router;
