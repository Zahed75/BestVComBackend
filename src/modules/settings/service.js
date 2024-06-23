const settingModel = require('./model');
const {
    BadRequest,
    Unauthorized,
    Forbidden,
    NoContent,
  } = require('../../utility/errors');
  const { SendEmailUtility } = require('../../utility/email');


  const createSetting = async (setting) => {
    try {
      const newSetting = await settingModel.create(setting);
      return newSetting;
    } catch (error) {
      throw new BadRequest(error.message);
    }
  }