module {
    public type WasmData = {
        dev : Principal;
        wasmModule: Blob
    };

    public type Release = {
        frontend: WasmData;
        backend: WasmData;
        journal: WasmData;
        manager: WasmData;
    };
    
};