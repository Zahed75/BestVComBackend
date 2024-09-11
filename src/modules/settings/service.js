const settingModel = require('./model');
const {
    BadRequest,
    Unauthorized,
    Forbidden,
    NoContent,
} = require('../../utility/errors');
const { SendEmailUtility } = require('../../utility/email');

const createEmailSettings = async (settings) => {
    try {
      const { userId, emails } = settings;

      const { emailStatus, emailReciepent, subject, enable, emailBody, emailHeader, emailType } = emails;
  
      if (!userId || !emailStatus || !emailReciepent || !subject || !enable || !emailBody || !emailHeader || !emailType) {
        throw new BadRequest('All fields are required');
      }
      const newSetting = await settingModel.create(settings);
      return newSetting;
    } catch (error) {
      throw new BadRequest(error.message);
    }
  };
  

  const updateEmailSettings = async (id, settings) => {
    try {
      const newSetting = await settingModel.findByIdAndUpdate(id, settings, { new: true });
      console.log(newSetting);
      return newSetting;
    } catch (error) {
      throw new BadRequest(error.message);
    }
  };
  


module.exports = {
    updateEmailSettings,
    createEmailSettings
} 