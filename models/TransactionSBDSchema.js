const mongoose = require("mongoose");

const TransactionSBDSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    lowercase: true,
  },
  to: {
    type: String,
    required: true,
    lowercase: true,
  },
  transaction_id: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  block_num: {
    type: Number,
    default: 0,
    equired: true,
    integer: true,
    validate(value) {
      if (value < 0)
        throw new Error("Block number can not possibly be less than zero.");
    },
  },
  amount: {
    type: Number,
    default: 0,
    equired: true,
    validate(value) {
      if (value < 0) throw new Error("Amount can not be negative.");
    },
  },
});

const TransactionSBD = mongoose.model("TransactionSBD", TransactionSBDSchema);

module.exports = TransactionSBD;
