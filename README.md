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

next, delete the package-lock.json file and the node_modules file

then run the following commands in the Internet-Identity project directory again

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

## Running the Ledger canister locally

1.) create a new project directory specifically for the ledger canister by running the following command in the CLI:

```
dfx new ledger_canister
```

2.) outside of the ledger_canister project directory, run the following commands in the CLI:

```
export IC_VERSION=a7058d009494bea7e1d898a3dd7b525922979039
curl -o ledger.wasm.gz https://download.dfinity.systems/ic/${IC_VERSION}/canisters/ledger-canister_notify-method.wasm.gz
gunzip ledger.wasm.gz
curl -o ledger.private.did https://raw.githubusercontent.com/dfinity/ic/${IC_VERSION}/rs/rosetta-api/ledger.did
curl -o ledger.public.did https://raw.githubusercontent.com/dfinity/ic/${IC_VERSION}/rs/rosetta-api/ledger_canister/ledger.did
```
3.) Copy the file you obtained at the second step ( `ledger.wasm` , `ledger.private.did` , `ledger.public.did` ) into the root of the ledger_canister project directory.

4.) Add the following canister definition to the `dfx.json` file in the ledger_canister project:

```
{
  "canisters": {
    "ledger": {
      "type": "custom",
      "wasm": "ledger.wasm",
      "candid": "ledger.private.did"
    }
  }
}
```

5.) start local replica: 
```
dfx start --background
```

6.) Create a new identity that will work as a minting account:
```
dfx identity new minter
dfx identity use minter
export MINT_ACC=$(dfx ledger account-id)
```
Transfers from the minting account will create `Mint` transactions. Transfers to the minting account will create `Burn` transactions.

7.) Switch back to your default identity and record its ledger account identifier: 
```
dfx identity use default
export LEDGER_ACC=$(dfx ledger account-id)
```

8.) Deploy the ledger canister to your network:
```
dfx deploy ledger --argument '(record {minting_account = "'${MINT_ACC}'"; initial_values = vec { record { "'${LEDGER_ACC}'"; record { e8s=100_000_000_000 } }; }; send_whitelist = vec {}})'
```
the ledger canister ID will be displayed in the terminal. copy this, as you will need it in a later step.

9.) Update the canister definition in the dfx.json file of the ledger_canister project to use the public Candid interface:
```
{
  "canisters": {
    "ledger": {
      "type": "custom",
      "wasm": "ledger.wasm",
      "candid": "ledger.public.did"
    }
  }
}
```
10.) Check that the canister works:
```
dfx canister call ledger account_balance '(record { account = '$(python3 -c 'print("vec{" + ";".join([str(b) for b in bytes.fromhex("'$LEDGER_ACC'")]) + "}")')' })'

```

11.) In YOUR project directory (not the ledger_canister project directory, but the project you're building) delete the following files if they are present:
 `/.dfx` 
`/dist` `/node_modules` 
`/package-lock.json` 
`/src/declarations`

12.) Add the following canister definition to the `dfx.json` file in YOUR project:

```
{
  "canisters": {
    "ledger": {
      "type": "custom",
      "wasm": "../ledger_canister/ledger.wasm",
      "candid": "../ledger_canister/ledger.public.did"
    }
  }
}
```

13.) run the following command from the CLI of the root directory of YOUR project (not the canister_ledger project):
```
npm i
dfx deploy
```

the build will fail the first time. don't panic.

13.) update 
```
"ledger": {
    "local": "gfeog-fiaaa-aaaaa-aad6a-cai"
  }
```
within the `.dfx/local/canister_ids.json` file with the ledger canister id that you retrieved in step 8.

14.) finally, run `dfx deploy` again. everything should deploy just fine this time. 
