Digital-Time-Capsule

in order to get the test Internet_Identity canister to work, you must do the following steps:

## Running Internet-Identity canister Locally

To run the internet_identity canisters, proceed as follows after cloning the internet_identity repository

Within the internet-identity project run the following commands:

npm i 

dfx start [--clean] [--background]

In a different terminal, run the following command to install the Internet Identity canister:


II_ENV=development dfx deploy --no-wallet --argument '(null)'.

THE BUILD SHOULD FAIL THE FIRST TIME. WHEN IT DOES, PERFORM THE FOLLOWING STEPS


replace the "build" within the dfx.json file of the Internet-Identity repo from {"src/internet_identity/build.sh"} to {"cargo build --release --target wasm32-unknown-unknown"}
next run the following commands in the Internet-Identity project directory again

npm i

dfx start [--clean] [--background]

In a different terminal, run the following command to install the Internet Identity canister:


II_ENV=development dfx deploy --no-wallet --argument '(null)'


THE BUILD SHOULD WORK THIS TIME

## Running the Digital-Time-Capsule repo locally

in the Digital-Time-Capsule project 

in the webpack.config.js file, be sure that the II_URL property uses the proper canister ID. it should use the canister ID of the local internet-identity canister. you find this in the termial where you deployed the local internet-identity repo. 

delete the /package-lock.json file, 
delete the /node_modules file,
delete the /dist file,
delete the /.dfx file,
delete the /src/declarations file

after deleting these files, run the following commands in the Digital-Time-Capsule terminal: 

npm i

then:

dfx start

then, in a new terminal: 

dfx deploy 

then: 

npm start
