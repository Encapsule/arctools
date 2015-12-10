#!/usr/bin/env node

var TOOLSLIB = require('./arc_tools_lib');
var TOOLS_META = TOOLSLIB.meta;
var ARC_CORE = TOOLSLIB.arccore;
var FILE_DIR_ENUMERATOR = TOOLSLIB.fileDirEnumSync;
var FILE_JSRC_LOADER = TOOLSLIB.jsrcFileLoaderSync;

var program = TOOLSLIB.commander;

program
    .version(TOOLS_META.version)
    .description("JBUS FilterDAG design artifact creation tool.")
    .command('manifest [path]', "Create a FilterDAG manifest from [specPath].")
    .action(function(command, path) {
        console.log("Received: " + command + " " + path);
    })
    .option('--info', 'Print tool information and exit.')

program.parse(process.argv);

var inBreakScope = false;
while (!inBreakScope) {
    inBreakScope = true;

    if (program.info) {
        console.log("CREATE");
        console.log(JSON.stringify(TOOLS_META, undefined, 4));
        break;
    }

    

}


