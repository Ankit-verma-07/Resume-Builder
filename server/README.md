Migration instructions

Run the following from the `server` folder to populate missing `username` fields from the email local-part:

PowerShell:

node migrations/populate-usernames.js

This will connect to the MongoDB configured in `db.js` and update users where `username` is missing or empty.
