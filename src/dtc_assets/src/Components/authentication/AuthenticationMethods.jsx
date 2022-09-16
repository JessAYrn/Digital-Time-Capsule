import { AuthClient } from "@dfinity/auth-client";
import { createActor, canisterId } from "../../../../declarations/dtc/index";
export const AuthenticateClient = async (dispatch, actionTypes) => {

    AuthClient.create().then(async (client) => {
        dispatch({
            actionType: actionTypes.SET_AUTH_CLIENT,
            payload: client
        });
        await client.isAuthenticated().then((result) => {
            dispatch({
                actionType: actionTypes.SET_IS_AUTHENTICATED,
                payload: result
            });
        });
        dispatch({
            actionType: actionTypes.SET_IS_LOGGING_IN,
            payload: true
        });
    });
};

export const CreateActor = async (journalState, dispatch, actionTypes) => {
    if(!journalState.authClient) return;

    const identity = journalState.authClient.getIdentity();
    const actor_ = createActor(canisterId, {
        agentOptions: {
            identity
        }
    });
    dispatch({
        actionType: actionTypes.SET_ACTOR,
        payload: actor_
    });

}