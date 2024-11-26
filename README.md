  This repository is coded such that local development of the user interface is conducted where the local host communicates with a pd_api canister that runs on the live internet computer network rather than a pd_api canister that runs locally. This allows for ease of testing within the context of a user interface that relies on developers logging in Internet Identity for testing.

  Developers looking to start their testing environment must follow the steps below:

  1. create `node_modules`:
    ```npm i```
  
  2. create a pd_api canister on the internet computer network:
    ```dfx canister create pd_api --network ic```

    ```dfx deploy pd_api --network ic```

  3. create and configure treasury canister, manager canister and ui canister on the internet computer network:
    ```dfx canister call pd_api configureApp --network ic```

    you may view the canister IDs of the newly created canisters by running the following command:
    ```dfx canister call pd_api getCanisterData --network ic```
    the frontendPrincipal property will read "Null" for up to 15 minutes following the call to the `configureApp` function.

  4. start local dfx session:
    ```dfx start --clean```

  5. create and build local instances of pd_api and pd_ui canisters:
    ```dfx canister create pd_api```

    ```dfx build pd_api```

    ```dfx canister create pd_ui``

    ```dfx build pd_ui```

  6. generate declarations for pd_api and pd_ui canisters:
  ```dfx generate pd_api```

  ```dfx generate pd_ui```

  7. within the `src/declarations/pd_api/pd_api.did` file replace all occurances of the string `composite query` with the string `composite query` 
  
    within the `src/declarations/pd_api/pd_api.did.js` file replace all occurances of the string `composite_query` with the string `query`

  8. run the following command:
    ```npm start```


### the following commands are stored below for referral purposes. 

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

dfx canister update-settings pd_api --add-controller <ADD_CONTROLLER>

### gzip wasm module before upgrading canister (note: after gzipping, you'll have to change the file name from pd.wasm.gz back to pd.wasm)
gzip -f -1 ./.dfx/ic/canisters/pd_api/pd_api.wasm  

### grant permissions within asset canister
dfx canister call pd_ui grant_permission '(record {to_principal = principal "22xax-4iaaa-aaaap-qbaiq-cai"; permission = variant {ManagePermissions} })' --network ic
