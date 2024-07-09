import { getCurrentURL, extractCanisterIdFromURL } from './Utils';
import { AuthClient }  from '@dfinity/auth-client';
import { Actor, HttpAgent } from "@dfinity/agent";
import * as canisterIds from "../../../../canister_ids.json";
import * as dtcFiles from "../../../declarations/dtc";
import * as dtcAssetsFiles from "../../../declarations/dtc_assets";

export const getLoginCredentials = async (anon) => {
  const authClient = await AuthClient.create();
  if(!anon)await new Promise((resolve, reject) => {
    authClient.login({
      onSuccess: resolve,
      onError: reject,
    });
  });
  const identity = authClient.getIdentity();
  const agent = new HttpAgent({ identity });
  return {agent};
};


export const getBackendActor = async ({anon = false}) => {
    const {agent} = await getLoginCredentials(anon);
    let dtc_canisterId;
    if(process.env.NODE_ENV === "development") dtc_canisterId = canisterIds.dtc.ic;
    else {
      let currentURL = getCurrentURL();
      let frontEndPrincipal = extractCanisterIdFromURL(currentURL);
      let dtcAssetsCanister = dtcAssetsFiles.createActor(frontEndPrincipal, {agentOptions: {host: "https://icp-api.io"}});
      let authorizedPrincipals = await dtcAssetsCanister.list_authorized();
      dtc_canisterId = authorizedPrincipals[0];
    }
    let actor = Actor.createActor(dtcFiles.idlFactory, { agent, canisterId: dtc_canisterId} );
    return {actor, agent};
  };