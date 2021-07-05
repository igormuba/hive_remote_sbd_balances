const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) throw new Error("Balance can not be negative.");
    },
  },
});

const Account = mongoose.model("Account", AccountSchema);

module.exports = Account;
