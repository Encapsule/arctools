#!/usr/bin/env node

var toolName = "arccore_document_filter";

var FS = require('fs');
var PATH = require('path');
var TOOLSLIB = require('./arc_tools_lib');
var FILELOADER = TOOLSLIB.jsrcFileLoaderSync;

var chalk = TOOLSLIB.chalk;
var theme = TOOLSLIB.clistyles;

var exitCode = 0;
var exitProgram = false;
var errors = [];
var innerResponse;

console.log(TOOLSLIB.createToolBanner(toolName));

var program = TOOLSLIB.commander;
program
    .version(TOOLSLIB.meta.version)
    .description("ARC Filter document generator")
    .option('--about', "Print tool information and exit.")
    .option('-f, --filter <filename>', "CommonJS module filename that implements the filter to document (required).")
    .option('-t, --template <filename>', "Handlebars template to use to generate the documentation (optional).")
    .option('-o, --output <filename>', "Filename to write the generated document to. If ommitted, write filter-operationID.md in same directory as the Filter module.")
    .option('--verbose', "Log diagnostic and informational messages to console.")
    .parse(process.argv);


if (program.about) {
    console.log(theme.infoBody(JSON.stringify(TOOLSLIB.meta, undefined, 4)));
    exitProgram = true;
}

while (!exitProgram) {
    exitProgram = true;

    var moduleResource = undefined;
    var templateResource = undefined;
    var outputFilename = undefined;

    ////
    // Load the target Filter module.
    //
    if (!program.filter) {
        errors.unshift("Missing required --filter filename.");
        break;
    }
    var filterModulePath = TOOLSLIB.paths.normalizePath(program.filter);
    if (!FS.existsSync(filterModulePath)) {
        errors.unshift("Bad filter module path. '" + filterModulePath + "' does not exist.");
        break;
    }
    if (!FS.statSync(filterModulePath).isFile()) {
        errors.unshift("Bad filter module path. '" + filterModulePath + "' is not a file.");
        break;
    }
    try {
        // This is a suboptimal solution that requires some additional thought/research.
        // What we want is to only load/execute runtime code that constructs the Filter
        // to be documented. This implementation indiscriminately executes whatever JavaScript
        // code happens to be in the target module and this is likely to have unintended
        // side-effects if used incorrectly. Several options are to explore the use of
        // jQuery loadScript or possibly even RequireJS. Or write a parser that extracts
        // what's needed from a JavaScript file without actually executing any of the script.
        moduleResource = require(filterModulePath);
    } catch (error_) {
        errors.unshift(error_.toString());
        errors.unshift("Fatal exception attempting to load '" + filterModulePath + "' module via `require`.");
        break;
    }
    console.log(theme.processStepHeader("> Loaded filter module '" + filterModulePath + "'"));

    ////
    // Load the target handlebars template.
    if (!program.template) {
        // Use arctools default template.
        var filterDocTemplatePath = PATH.resolve(__dirname, 'templates', 'filter.hbs');
        var loaderResponse = FILELOADER.request(filterDocTemplatePath);
        if (loaderResponse.error) {
            errors.unshift(loaderResponse.error);
            break;
        }
        templateResource = loaderResponse.result.resource;
    } else {
        // Attempt to load the template specified on the command line.
        templatePath = TOOLSLIB.paths.normalizePath(program.template);
        if (!FS.existsSync(templatePath)) {
            errors.unshift("Bad template path. '" + templatePath + "' does not exist.");
            break;
        }
        if (!FS.statSync(templatePath).isFile()) {
            errors.unshift("Bad template path. '" + templatePath + "' is not a file.");
            break;
        }
        var loaderResponse = FILELOADER.request(templatePath);
        if (loaderResponse.error) {
            errors.unshift(loaderResponse.error);
            break;
        }
        templateResource = loaderResponse.result.resource;
    }
    console.log(theme.processStepHeader("> Loaded handlebars template '" + filterModulePath + "'"));

    ////
    // If an output filename was specified, ensure that it's a valid path.
    if (program.output) {
        outputFilename = TOOLSLIB.paths.normalizePath(program.output);
        var pathParse = PATH.parse(outputFilename);
        if (!FS.existsSync(pathParse.dir)) {
            errors.unshift("Invalid output filename. The parent directory '" + pathParse.dir + "' does not exist.");
            break;
        }
        if (FS.existsSync(outputFilename)) {
            if (!FS.statSync(outputFilename).isFile()) {
                errors.unshift("Invalid output filename. '" + outputFilename + "' exists already and is not a file.");
                break;
            }
        }
    }

    ////
    // Call the Filter documentation generator.
    //
    var generatorResponse = TOOLSLIB.filterDocGenerate.request({
        filter: moduleResource,
        template: templateResource
    });
    if (generatorResponse.error) {
        errors.unshift(generatorResponse.error);
        break;
    }
    console.log(theme.processStepHeader("> Generated documentation for filter '" + moduleResource.filterDescriptor.operationID + "'"));

    if (outputFilename) {
        writerResponse = TOOLSLIB.stringToFileSync.request({
            path: outputFilename,
            resource: generatorResponse.result
        });
        if (writerResponse.error) {
            errors.unshift(writerResponse.error);
            break;
        }
        console.log(theme.processStepHeader("> Wrote documentation to file '" + outputFilename + "'"));
    } else {
        console.log(generatorResponse.result);
    }

    break;
}


////
// Epilogue
if (errors.length) {
    exitCode = 1;
    console.error(theme.toolError(errors.join(" ")));
    console.log(theme.bannerExit(toolName + " exit with status ") + theme.exitCode(exitCode));
} else {
    exitCode = 0;
}
return exitCode;
// eof
////

