import Nat64 "mo:base/Nat64";
import Cycles "mo:base/ExperimentalCycles";
import Blob "mo:base/Blob";
import IC "../../Types/IC/types";

module{

    public let CURRENCIES = {btc = "BTC"; usd = "USD"; xdr = "XDR"; icp = "ICP"; eth = "ETH"; };

    public func getCurrencyExchangeRate(
        unitCurrency: Text, 
        otherCurrency: Text, 
        transformFn: query ({context: Blob; response: IC.http_response}) -> async IC.http_response
        ) : async IC.http_response {
    
        let host : Text = "api.coinbase.com";
        let url = "https://" # host # "/v2/exchange-rates?currency=" # unitCurrency;
        let ic : IC.Self = actor("aaaaa-aa");
        let transform_context = { function = transformFn; context = Blob.fromArray([]); };
        let request_headers = [ { name = "Host"; value = host # ":443" }, { name = "User-Agent"; value = "exchange_rate_canister" }];
        let http_request = {
            url = url;
            max_response_bytes = null; //optional for request
            headers = request_headers;
            body = null; //optional for request
            method = #get;
            transform = ?transform_context;
        };
        Cycles.add(20_949_972_000);
        let http_response : IC.http_response = await ic.http_request(http_request);
    };
};