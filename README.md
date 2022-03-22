Digital-Time-Capsule

in order to get the test Internet_Identity canister to work, you must do the following steps:

## Running Internet-Identity canister Locally

To run the internet_identity canisters, proceed as follows after cloning the internet_identity repository

Within the internet-identity project run the following commands:

npm i 

dfx start --clean --background

In a different terminal, run the following command to install the Internet Identity canister:


II_ENV=development dfx deploy --no-wallet --argument '(null)'.

THE BUILD SHOULD FAIL THE FIRST TIME. WHEN IT DOES, PERFORM THE FOLLOWING STEPS


replace the "build" within the dfx.json file of the Internet-Identity repo from {"src/internet_identity/build.sh"} to {"cargo build --release --target wasm32-unknown-unknown"}

next, delete the package-lock.json file and the node_modules file

then run the following commands in the Internet-Identity project directory again

npm i

dfx start --clean --background

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

add the follow property to the "canisters" object in the dfx.json file:

```
"ledger": {
      "type": "custom",
      "wasm": "ledger.wasm",
      "candid": "ledger.public.did"
    },
```

change the "candid": "ledger.public.did" line of the dfx.json file so that it reads "candid": "ledger.private.did"

start local replica by running the following line:

```
dfx start --background
```

Create a new identity that will work as a minting account by running the following lines:

```
dfx identity new minter
dfx identity use minter
export MINT_ACC=$(dfx ledger account-id)
```

Switch back to your default identity and record its ledger account identifier by running the following lines:

```
dfx identity use default
export LEDGER_ACC=$(dfx ledger account-id)
```

Deploy the ledger canister to your network by running the following line:
```
dfx deploy ledger --argument '(record {minting_account = "'${MINT_ACC}'"; initial_values = vec { record { "'${LEDGER_ACC}'"; record { e8s=100_000_000_000 } }; }; send_whitelist = vec {}})'
```

change the "candid": "ledger.private.did" line of the dfx.json file back so that it reads "candid": "ledger.public.did" again.

Take the ledger canister-id and set it as the value of the CANISTER_ID variable in the Digital-Time-Capsule/src/dtc/ledger.mo file. 

run the following commands in the Digital-Time-Capsule terminal: 

npm i

then:

dfx start

then, in a new terminal: 

dfx deploy 

then: 

npm start

## Deploying to the Mainnet

first, be sure that you delete the following from the dfx.json file

```
"ledger": {
      "type": "custom",
      "wasm": "ledger.wasm",
      "candid": "ledger.public.did"
    },
```

Change the CANISTER_ID variable in the Digital-Time-Capsule/src/dtc/ledger.mo file to "ryjl3-tyaaa-aaaaa-aaaba-cai" (This is the canister-id of the ledger canister on the mainnet);

run the following commands

npm install
// to deploy all canisters at once
dfx deploy --network ic 

// to deploy front-end canister only
dfx deploy --network ic dtc_assets

// to deploy back-end canister only
dfx deploy --network ic dtc_assets

## Command for minting ICP

```
dfx canister call ledger transfer 'record {memo = 1234; amount = record { e8s=10_000_000_000 }; fee = record { e8s=10_000 }; from_subaccount = null; to =  '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$LEDGER_ACC'")]) + "}")')'; created_at_time = null }' 

```

## Command to view ICP balance 

```
dfx canister call ledger account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$LEDGER_ACC'")]) + "}")')' })'
```

### Command for setting variable name for an account-id
```
export JESSE_ACC=73cee9e565a0eb00aafdefdd04a14f6e6339f0cc8715dba8d353d57e7fda6da2
```

<!-- this above command creates a variable named 'JESSE_ACC' and sets it equal to the long string of characters on the right side of the equal sign -->
