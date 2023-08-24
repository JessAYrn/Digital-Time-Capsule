export const CreateUserJournal = async (actorState) => {
    try{
        let registrationResult = await actorState.backendActor.registerOwner();
    } catch(e) {
        console.log('could not be verified');
    }
    let result = await actorState.backendActor.create();
    return result;
    
}
