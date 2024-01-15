import Random "mo:base/Random";
import Error "mo:base/Error";

module{
    public func generateNonceForECDSA() : async [Nat8] {
        let random = Random.Finite(await Random.blob()); 
        let byte_1_option = random.byte();
        let byte_2_option = random.byte();
        let byte_3_option = random.byte();
        let byte_4_option = random.byte();
        let byte_5_option = random.byte();
        let byte_6_option = random.byte();
        let byte_7_option = random.byte();
        let byte_8_option = random.byte();
        switch(byte_1_option){ 
            case null { throw Error.reject("nonce #1 not retrieved")};
            case (?byte_1){
                switch(byte_2_option){ 
                    case null { throw Error.reject("nonce #2 not retrieved")};
                    case(?byte_2){
                        switch(byte_3_option){ 
                            case null { throw Error.reject("nonce #3 not retrieved")};
                            case(?byte_3){
                                switch(byte_4_option){ 
                                    case null { throw Error.reject("nonce #4 not retrieved") };
                                    case(?byte_4){
                                        switch(byte_5_option){ 
                                            case null { throw Error.reject("nonce #5 not retrieved")};
                                            case(?byte_5){
                                                switch(byte_6_option){ 
                                                    case null { throw Error.reject("nonce #6 not retrieved")};
                                                    case(?byte_6){
                                                        switch(byte_7_option){ 
                                                            case null { throw Error.reject("nonce #7 not retrieved")};
                                                            case(?byte_7){
                                                                switch(byte_8_option){ 
                                                                    case null { throw Error.reject("nonce #8 not retrieved")};
                                                                    case(?byte_8){
                                                                        return [byte_1, byte_2, byte_3, byte_4, byte_5, byte_6, byte_7, byte_8];
                                                                    };
                                                                };  
                                                            };
                                                        };  
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        }; 
                    };
                };
            };
        };
    };
}