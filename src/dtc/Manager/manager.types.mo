module {
    public type WasmData = {
        version : Text;
        hash : Blob;
        dev : Principal;
        wasmModule: Blob
    };
};