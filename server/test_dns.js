const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const host = '_mongodb._tcp.technozone.4oxsjwg.mongodb.net';

dns.resolveSrv(host, (err, addresses) => {
    if (err) {
        console.error('DNS Resolve SRV Error:', err);
    } else {
        console.log('DNS Resolve SRV Success:', addresses);
    }
});

dns.lookup('technozone.4oxsjwg.mongodb.net', (err, address, family) => {
    if (err) {
        console.error('DNS Lookup Error:', err);
    } else {
        console.log('DNS Lookup Success:', address, 'family:', family);
    }
});
