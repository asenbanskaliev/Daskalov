import test from "node:test";
import assert from "node:assert/strict";
import {isPrivateClient} from "../server/access-policy.mjs";
const request=(address,host="localhost:3000")=>({headers:{host},socket:{remoteAddress:address}});
test("SEC-010: private API needs actual loopback TCP peer and local Host",()=>{
 for(const ip of ["127.0.0.1","::1","::ffff:127.0.0.1"])assert.equal(isPrivateClient(request(ip)),true);
 for(const ip of ["198.51.100.9","10.1.1.2",null])assert.equal(isPrivateClient(request(ip)),false);
 assert.equal(isPrivateClient(request("127.0.0.1","example.org")),false);
 assert.equal(isPrivateClient(request("198.51.100.9","localhost")),false);
 assert.equal(isPrivateClient(null),false);
});
