# Hive SBD deposits monitor

This software is under develop and may not work as expected.
The goal is to monitor and store a book of balances of who sent how much to this account.

Example:
johndoe sends 10SBD to this account
this account sends 5 SBD to john down

This software is supposed to store all transactions and the final credit johndoe can withdraw from this account (5 SBD) in this case.

This software uses the .env file and the variables it expects to receive are:

- `MONGODBURI` example line 1: `MONGODBURI = mongodb://127.0.0.1:27017/?gssapiServiceName=mongodb`
- `HIVEACCOUNT` example line 2: `HIVEACCOUNT = luckdao`

# Authors/Contributors:

- http://hive.blog/@luckdao
- http://hive.blog/@igormuba
