#!/usr/bin/env node
"use strict";

var toolName = "arc_project";
var projectFilename = "arctools.json";

var FS = require('fs');

var PATH = require('path');

var TOOLSLIB = require('./arc_tools_lib');

var FILELOADER = TOOLSLIB.jsrcFileLoaderSync;
var chalk = TOOLSLIB.chalk;
var theme = TOOLSLIB.clistyles;
var filters = {};
filters.projectConstruct = require('./arc_tools_project_construct');
filters.projectParse = require('./arc_tools_project_parse');
var arctoolsProjectData = undefined;
var exitCode = 0;
var exitProgram = false;
var errors = [];
var innerResponse;
console.log(TOOLSLIB.createToolBanner(toolName));
var program = TOOLSLIB.commander;
program.version(TOOLSLIB.meta.version).description("ARC tool project").option('--about', "Print tool information and exit.").option('-d, --directory <directory>', "Use <directory> to find " + projectFilename + ".").option('--initialize', "Initialize a new '" + projectFilename + "' file.").option('--verbose', "Log diagnostic and informational messages to console.").parse(process.argv);

if (program.about) {
  console.log(theme.infoBody(JSON.stringify(TOOLSLIB.meta, undefined, 4)));
  exitProgram = true;
}

while (!exitProgram && !errors.length) {
  var filterDocTemplatePath = PATH.resolve(__dirname, 'templates', 'filter.hbs');
  var loaderResponse = FILELOADER.request(filterDocTemplatePath);

  if (loaderResponse.error) {
    errors.unshift(loaderResponse.error);
    break;
  }

  var projectDirectory = TOOLSLIB.paths.normalizePath(program.directory || "./");
  var projectPath = undefined;

  if (program.verbose) {
    console.log("Searching for " + toolName + " project file '" + projectFilename + "'");
    console.log("Initial search directory '" + projectDirectory + "'");
  }

  if (!FS.existsSync(projectDirectory)) {
    errors.unshift("Bad search directory. Path '" + projectDirectory + "' does not exist.");
    break;
  }

  if (!FS.statSync(projectDirectory).isDirectory()) {
    errors.unshift("Bad search directory. Path '" + request_.parentDirectory + "' is not a directory.");
    break;
  }

  if (program.verbose) {
    console.log("Searching in and below:");
  }

  var innerResponse = TOOLSLIB.fileDirEnumSync.request({
    directory: projectDirectory,
    callback: function callback(file_) {
      var parsePath = PATH.parse(file_);
      var include = parsePath.base === projectFilename;

      if (program.verbose) {
        console.log("'" + file_ + "' " + include);
      }

      return include;
    }
  });

  if (innerResponse.error) {
    errors.unshift(innerResponse.error);
    break;
  }

  if (innerResponse.result.files.length) {
    if (innerResponse.result.files.length > 1) {
      errors.push("More than one '" + projectFilename + "' files located. Please constrain the search with the --directory option.");
      console.log(theme.errorReportErrors(JSON.stringify(innerResponse.result.files, undefined, 4)));
      break;
    }

    projectPath = innerResponse.result.files[0];
    projectDirectory = PATH.parse(projectPath).dir;

    if (program.verbose) {
      console.log("Project directory and path reset below (subpath) of initial directory.");
    }
  } else {
    if (!program.directory) {
      if (program.verbose) {
        console.log("Searching above:");
      }

      var seek = true;
      var searchDirectory = TOOLSLIB.paths.normalizePath(projectDirectory + "./..");

      while (seek) {
        var seekProject = PATH.join(searchDirectory, projectFilename);

        if (!FS.existsSync(seekProject)) {
          if (program.verbose) {
            console.log("'" + seekProject + "' false");
          }
        } else {
          projectDirectory = searchDirectory;
          projectPath = seekProject;

          if (program.verbose) {
            console.log("Found project above: '" + theme.dirInput(projectPath) + "'");
          }

          break;
        }

        if (searchDirectory === "/") {
          if (program.verbose) {
            console.log("We're at the root of the filesystem. Giving up.");
          }

          break;
        }

        searchDirectory = TOOLSLIB.paths.normalizePath(searchDirectory + "./..");
      }
    } else {
      if (program.verbose) {
        console.log("No check of parent directories for project JSON if --directories is specified.");
      }
    }
  }

  if (!projectPath) {
    projectPath = TOOLSLIB.paths.normalizePath(PATH.join(projectDirectory, projectFilename));

    if (program.verbose) {
      console.log("Using default project JSON filename '" + projectPath + "'.");
    }
  }

  if (program.initialize !== undefined) {
    console.log(theme.processStepHeader("Attempting to initialize a new project..."));

    if (FS.existsSync(projectPath)) {
      errors.unshift("The target file '" + projectPath + "' already exists. If you really want to re-initialize, please manually remove/rename the existing file.");
      break;
    }

    innerResponse = filters.projectConstruct.request();

    if (innerResponse.error) {
      errors.unshift(innerResponse.error);
      break;
    }

    arctoolsProjectData = innerResponse.result;
  } else {
    console.log(theme.processStepHeader("Attempting to open existing project..."));
    console.log(theme.dirInput("'" + projectPath + "'"));
    innerResponse = TOOLSLIB.jsrcFileLoaderSync.request(projectPath);

    if (innerResponse.error) {
      errors.unshift(innerResponse.error);
      break;
    }

    innerResponse = filters.projectParse.request(innerResponse.result.resource);

    if (innerResponse.error) {
      errors.unshift(innerResponse.error);
      break;
    }

    arctoolsProjectData = innerResponse.result;
  }

  arctoolsProjectData.projectState = arctoolsProjectData.projectState.toObject();
  console.log("arctoolsProjectData = '" + JSON.stringify(arctoolsProjectData, undefined, 4));
  innerResponse = TOOLSLIB.stringToFileSync.request({
    resource: JSON.stringify(arctoolsProjectData, undefined, 4),
    path: projectPath
  });

  if (innerResponse.error) {
    errors.unshift(innerResponse.error);
    break;
  }

  console.log("Wrote '" + projectPath + "'.");
  break;
}

;

if (errors.length) {
  exitCode = 1;
  console.log(theme.toolError(errors.join(" ")));
} else {
  exitCode = 0;
}

console.log(theme.bannerExit(toolName + " exit with status ") + theme.exitCode(exitCode));
process.exit(exitCode);