Digital-Time-Capsule

## Running the Digital-Time-Capsule repo locally

in the Digital-Time-Capsule project 

in the webpack.config.js file, be sure that the II_URL property uses the proper canister ID. it should use the canister ID of the local internet-identity canister. you find this in the termial where you deployed the local internet-identity repo. 

delete the /package-lock.json file, 
delete the /node_modules file,
delete the /dist file,
delete the /.dfx file,
delete the /src/declarations file

add the follow properties to the "canisters" object in the dfx.json file:

```
"ledger": {
      "type": "custom",
      "wasm": "ledger.wasm",
      "candid": "ledger.public.did"
  },
  "internet_identity": {
      "type": "custom",
      "candid": "https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity.did",
      "wasm": "https://github.com/dfinity/internet-identity/releases/latest/download/internet_identity_dev.wasm",
      "shrink": false,
      "remote": {
        "candid": "internet_identity.did",
        "id": {
          "ic": "rdmx6-jaaaa-aaaaa-aaadq-cai"
        }
      }
    },
```

start local replica by running the following line:

```
dfx start --clean
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

### deploy the internet identity canister locally

Deploy the internet identity app to your network by running the following line:
```
dfx deploy internet_identity
```

take the canister id for the internet identity canister and set it as the value of the LOCAL_II_CANISTER_ID variable located on line 8 
of the webpack.config.js file.


### deploy the ledger canister locally

change the "candid": "ledger.public.did" line of the dfx.json file so that it reads "candid": "ledger.private.did"

Deploy the ledger canister to your network by running the following line:
```
dfx deploy ledger --argument '(record {minting_account = "'${MINT_ACC}'"; initial_values = vec { record { "'${LEDGER_ACC}'"; record { e8s=100_000_000_000 } }; }; send_whitelist = vec {}})'
```

change the "candid": "ledger.private.did" line of the dfx.json file back so that it reads "candid": "ledger.public.did" again.

Take the ledger canister-id and set it as the value of the CANISTER_ID variable in the Digital-Time-Capsule/src/dtc/ledger.mo file. 

### deploy the backend and frontend canisters locally

set the isLocal var in the main.mo file to true;

run the following commands in the Digital-Time-Capsule terminal: 

npm i

then:

dfx deploy dtc

then:

dfx deploy dtc_assets

then: 
## the server only works in localhost with node versions up to 16. so you have to swtich to version 16
nvm use 16.15.1

then:
npm start

## Deploying to the Mainnet

set the isLocal var in the main.mo file to false;

Change the CANISTER_ID variable in the Digital-Time-Capsule/src/dtc/ledger.mo file to "ryjl3-tyaaa-aaaaa-aaaba-cai" (This is the canister-id of the ledger canister on the mainnet);

run the following commands

npm install

// to deploy back-end canister only
dfx deploy --network ic dtc

// to deploy front-end canister only
dfx deploy --network ic dtc_assets


## Command for minting ICP

```
dfx canister call ledger transfer 'record {memo = 1234; amount = record { e8s=10_000_000_000 }; fee = record { e8s=10_000 }; from_subaccount = null; to =  '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$JESSE_ACC'")]) + "}")')'; created_at_time = null }' 

```

## Command to view ICP balance 

```
dfx canister call ledger account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$JESSE_ACC'")]) + "}")')' })'
```

### Command for setting variable name for an account-id
```
export JESSE_ACC=73cee9e565a0eb00aafdefdd04a14f6e6339f0cc8715dba8d353d57e7fda6da2
```

<!-- this above command creates a variable named 'JESSE_ACC' and sets it equal to the long string of characters on the right side of the equal sign -->

### command for retrieving the canister-id of the default identity's wallet: 

dfx identity --network ic get-wallet

### command for retrieving the principal of the default identity:

dfx identity --network ic get-principal

### command for sending cycles from the default canister to another canister

dfx wallet --network ic send <destination> <amount>

### command for viewing cycles balance 

dfx wallet balance

### command for viewing the principals of the controllers of the canister

dfx canister --network ic info $(dfx identity --network ic get-wallet)

### command for setting a new controller for a canister

dfx canister --network ic update-settings --add-controller <PRINCIPAL_OF_NEW_CONTROLLER> <CANISTER_ID>

### Upgrade dfx SDK

sude dfx upgrade

### Change Freezing threshold

dfx canister --network ic  update-settings <canister_id> --freezing-threshold <NEW_THRESHOLD_VALUE>

### Add a new controller

dfx canister update-settings dtc --add-controller <ADD_CONTROLLER>

### gzip wasm module before upgrading canister (note: after gzipping, you'll have to change the file name from dtc.wasm.gz back to dtc.wasm)
gzip -f -1 ./.dfx/ic/canisters/dtc/dtc.wasm  

### grant permissions within asset canister
dfx canister call dtc_assets grant_permission '(record {to_principal = principal "22xax-4iaaa-aaaap-qbaiq-cai"; permission = variant {ManagePermissions} })' --network ic
