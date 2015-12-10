#!/usr/bin/env node

////
// Inspired by: https://developer.atlassian.com/blog/2015/11/scripting-with-node/
//

var TOOLSLIB = require('./arc_tools_lib');
var TOOLS_META = TOOLSLIB.meta;
var ARC_CORE = TOOLSLIB.arccore;
var program = TOOLSLIB.commander;

program.version(TOOLS_META.version).
    option('--info', 'Print tool information.').
    parse(process.argv);

if (program.info) {
    console.log(JSON.stringify(ARC_CORE.__meta, undefined, 4));
    process.exit(0);
}

var iruts = [];
for (var x = 0 ; x < 25 ; x++) {
    iruts.push(ARC_CORE.identifier.irut.fromEther());
}
console.log(JSON.stringify(iruts, undefined, 4));
process.exit(0);



