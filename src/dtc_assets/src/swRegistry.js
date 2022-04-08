if('serviceWorker' in navigator){
    navigator.serviceWorker.register('https://cqjyx-qqaaa-aaaap-qaakq-cai.ic0.app/src/dtc_assets/src/sw.js')
        .then((reg) => {
            console.log('Service Worker Registered: ', reg);
        })
        .catch((err) => {
            console.log('Service Worker Not Registered: ', err);
        });
}