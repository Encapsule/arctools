#!/usr/bin/env node
"use strict";

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
program.version(TOOLSLIB.meta.version).description("ARC Filter document generator").option('--about', "Print tool information and exit.").option('-f, --filter <filename>', "CommonJS module filename that implements the filter to document (required).").option('-t, --template <filename>', "Handlebars template to use to generate the documentation (optional).").option('-o, --output <filename>', "Filename to write the generated document to. If ommitted, write filter-operationID.md in same directory as the Filter module.").option('--verbose', "Log diagnostic and informational messages to console.").parse(process.argv);

if (program.about) {
  console.log(theme.infoBody(JSON.stringify(TOOLSLIB.meta, undefined, 4)));
  exitProgram = true;
}

while (!exitProgram) {
  exitProgram = true;
  var moduleResource = undefined;
  var templateResource = undefined;
  var outputFilename = undefined;

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
    moduleResource = require(filterModulePath);
  } catch (error_) {
    errors.unshift(error_.toString());
    errors.unshift("Fatal exception attempting to load '" + filterModulePath + "' module via `require`.");
    break;
  }

  console.log(theme.processStepHeader("> Loaded filter module '" + filterModulePath + "'"));

  if (!program.template) {
    var filterDocTemplatePath = PATH.resolve(__dirname, 'templates', 'filter.hbs');
    var loaderResponse = FILELOADER.request(filterDocTemplatePath);

    if (loaderResponse.error) {
      errors.unshift(loaderResponse.error);
      break;
    }

    templateResource = loaderResponse.result.resource;
  } else {
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
    var writerResponse = TOOLSLIB.stringToFileSync.request({
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

if (errors.length) {
  exitCode = 1;
  console.error(theme.toolError(errors.join(" ")));
  console.log(theme.bannerExit(toolName + " exit with status ") + theme.exitCode(exitCode));
} else {
  exitCode = 0;
}

process.exit(exitCode);