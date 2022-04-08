if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/Digital-Time-Capsule/src/dtc_assets/src//sw.js')
        .then((reg) => {
            console.log('Service Worker Registered: ', reg);
        })
        .catch((err) => {
            console.log('Service Worker Not Registered: ', err);
        });
}