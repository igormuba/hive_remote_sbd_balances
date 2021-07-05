const TransactionSBDSchema = require("./models/TransactionSBDSchema");
const AccountSchema = require("./models/AccountSchema");
var hive = require("@hiveio/hive-js");
var CronJob = require("cron").CronJob;
const mongoose = require("mongoose");

require("dotenv").config();

//block to start monitoring from
var first_block = 55358003;
let last_checked_block = first_block;
let last_checked_block_verified_on_start = false;

let last_irreversible_block_num = 55357992;
const uri = process.env.MONGODBURI;
const hiveAccountToWatchSBDDeposits = process.env.HIVEACCOUNT || "luckdao";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

let opts = {};

//connect to production server
opts.addressPrefix = "STM";
opts.chainId =
  "beeab0de00000000000000000000000000000000000000000000000000000000";

//connect to server which is connected to the network/production

function getBlockchainData() {
  return new Promise((resolve, reject) => {
    hive.api.getDynamicGlobalProperties(function (err, result) {
      if (!err) {
        resolve(result);
      } else {
        reject(err);
      }
    });
  });
}

hive.api.setOptions({ url: "https://api.deathwing.me" });

let lock = false;
var job = new CronJob(
  "* * * * * *",
  async function () {
    if (!lock) {
      lock = true;

      //updates the latest block of the latest transaction savd
      if (!last_checked_block_verified_on_start) {
        let latestTransaction = await TransactionSBDSchema.findOne().sort({
          block_num: -1,
        });
        if (latestTransaction) {
          last_checked_block = latestTransaction.block_num;
        }
        last_checked_block_verified_on_start = true;
      }

      //updates the latest immutable block on the blockchain
      let latestBlock = await getBlockchainData();
      last_irreversible_block_num = latestBlock.last_irreversible_block_num;

      if (last_checked_block < last_irreversible_block_num) {
        hive.api.getBlock(last_checked_block, async function (err, result) {
          if (result) {
            console.log("Checking block:");

            console.log(last_checked_block);
            let transactions = result.transactions.map((transaction) =>
              transaction.operations.map((operation) => ({
                ...operation,
                transaction_id: transaction.transaction_id,
              }))
            );
            for (let transaction of transactions) {
              // console.log(transaction);
              transaction = transaction[0];
              transaction_id = transaction["transaction_id"];
              if (transaction[0] === "transfer") {
                let operation = transaction[1];
                operation["transaction_id"] = transaction_id;
                operation["block_num"] = last_checked_block;
                if (
                  operation.from === hiveAccountToWatchSBDDeposits ||
                  operation.to === hiveAccountToWatchSBDDeposits
                ) {
                  operation["amount"] = parseFloat(
                    operation["amount"].split(" ")[0]
                  );
                  let newTransaction = await TransactionSBDSchema.findOne({
                    transaction_id: operation.transaction_id,
                  });
                  if (!newTransaction) {
                    newTransaction = await new TransactionSBDSchema(operation);
                    await newTransaction.save();
                    if (operation.to === hiveAccountToWatchSBDDeposits) {
                      let newUser = await AccountSchema.findOne({
                        name: operation.from,
                      });
                      if (!newUser) {
                        newUser = new AccountSchema({ name: operation.from });
                        await newUser.save();
                      }
                      await AccountSchema.findOneAndUpdate(
                        { name: operation.from },
                        { balance: (newUser.balance += operation.amount) }
                      );
                    } else {
                      let newUser = await AccountSchema.findOne({
                        name: operation.to,
                      });
                      if (!newUser) {
                        newUser = new AccountSchema({ name: operation.to });
                        await newUser.save();
                      } else {
                        await AccountSchema.findOneAndUpdate(
                          { name: operation.to },
                          { balance: (newUser.balance -= operation.amount) }
                        );
                      }
                    }
                  }
                }
              }
            }

            console.log(last_checked_block);
            console.log("BLOCK CHECKED!");
            last_checked_block++;
          } else {
            console.log("err");
            console.log(err);
          }
        });
      }
    }
    lock = false;
  },
  null,
  true,
  "America/Los_Angeles"
);
