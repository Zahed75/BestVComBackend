const mongoose = require('mongoose');

const tempEventSchema = new mongoose.Schema({
   

});

const tempEventModel = mongoose.model('tempEvents', tempEventSchema);

module.exports = tempEventModel;
