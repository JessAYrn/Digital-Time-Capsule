import { PlugLogin, StoicLogin, NFIDLogin, IdentityLogin, CreateActor, CreateAnonAgent } from 'ic-auth';
import { getCurrentURL, extractCanisterIdFromURL } from './Utils';
import * as canisterIds from "../../../../canister_ids.json";
import * as dtcFiles from "../../../declarations/dtc"
import * as dtcAssetsFiles from "../../../declarations/dtc_assets";


export const IDENTITY_PROVIDERS = {
    plug: "Plug",
    stoic: "Stoic",
    nfid: "NFID",
    identity: "Identity"    
};

export const getUserObject = async (provider, canisterId) => {
    if(provider === IDENTITY_PROVIDERS.plug) return await PlugLogin([canisterId]);
    else if(provider === IDENTITY_PROVIDERS.stoic) return await StoicLogin();
    else if(provider === IDENTITY_PROVIDERS.nfid) return await NFIDLogin();
    else if(provider === IDENTITY_PROVIDERS.identity) return await IdentityLogin();
};


export const getBackendActor = async (provider = null) => {
    let dtc_canisterId;
    if(process.env.NODE_ENV === "development") dtc_canisterId = canisterIds.dtc.ic;
    else {
      let currentURL = getCurrentURL();
      let frontEndPrincipal = extractCanisterIdFromURL(currentURL);
      let dtcAssetsCanister = dtcAssetsFiles.createActor(frontEndPrincipal, {agentOptions: {host: "https://icp-api.io"}});
      let authorizedPrincipals = await dtcAssetsCanister.list_authorized();
      dtc_canisterId = authorizedPrincipals[0];
    }
    let userObject_;
    if(!provider) userObject_ = {principal: "2vxsx-fae" , agent: await CreateAnonAgent()};
    else  userObject_ = await getUserObject(provider, dtc_canisterId);
    const dtc_idlFactory = dtcFiles.idlFactory;
    let actor = await CreateActor(userObject_.agent, dtc_idlFactory, dtc_canisterId);
    return {actor, userObject: userObject_};
  };