import { getCurrentURL, extractCanisterIdFromURL } from './Utils';
import { AuthClient }  from '@dfinity/auth-client';
import { Actor, HttpAgent } from "@dfinity/agent";
import * as canisterIds from "../../../../canister_ids.json";
import * as pdApiFiles from "../../../declarations/pd_api";
import * as pdUiFiles from "../../../declarations/pd_ui";

export const getLoginCredentials = async (anon) => {
  const authClient = await AuthClient.create();
  if(!anon)await new Promise((resolve, reject) => {
    authClient.login({
      onSuccess: resolve,
      onError: reject,
    });
  });
  const identity = authClient.getIdentity();
  const agent = new HttpAgent({ identity, host: "https://icp-api.io" });
  return {agent};
};


export const getBackendActor = async ({anon = false}) => {
    const {agent} = await getLoginCredentials(anon);
    let pd_api_canisterId;
    if(process.env.NODE_ENV === "development") pd_api_canisterId = canisterIds.pd_api.ic;
    else {
      let currentURL = getCurrentURL();
      let frontEndPrincipal = extractCanisterIdFromURL(currentURL);
      let pdUiCanister = pdUiFiles.createActor(frontEndPrincipal, {agentOptions: {host: "https://icp-api.io"}});
      let authorizedPrincipals = await pdUiCanister.list_authorized();
      pd_api_canisterId = authorizedPrincipals[0];
    }
    let actor = Actor.createActor(pdApiFiles.idlFactory, { agent, canisterId: pd_api_canisterId} );
    return {actor, agent};
  };