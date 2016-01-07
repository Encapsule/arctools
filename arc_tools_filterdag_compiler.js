#!/usr/bin/env node

var toolName = "arc_compileFilterDAG";

var FS = require('fs');
var PATH = require('path');
var TOOLSLIB = require('./arc_tools_lib');
var TOOLS_META = TOOLSLIB.meta;
TOOLS_META.name="Encapsule/arctools";

var ARC_CORE = TOOLSLIB.arccore;
var FILE_DIR_ENUMERATOR = TOOLSLIB.fileDirEnumSync;
var FILE_JSRC_LOADER = TOOLSLIB.jsrcFileLoaderSync;
var FILE_RC_WRITER = TOOLSLIB.stringToFileSync;
var SPEC_LOADER = TOOLSLIB.filterdagSpecLoader;

var clistyle = TOOLSLIB.clistyles;

var normalizePath = TOOLSLIB.paths.normalizePath;

console.log(TOOLSLIB.createToolBanner(toolName));

var program = TOOLSLIB.commander;

program
    .version(TOOLS_META.version)
    .description("JBUS FilterDAG specification compiler.")
    .option('--info', 'Print tool information and exit.')
    .option('-i, --ioDir <in_dir>', "Input from ioDir/specs, output to ioDir/manifest. (default: ./)")
    .parse(process.argv);

var bounce = false;
var errors = [];


while (!bounce) {
    bounce = true;

    var ioDir = program.ioDir || "./";
    var inputDirPath = normalizePath(PATH.join(ioDir, "specs/"));
    var outputDirPath = normalizePath(PATH.join(ioDir, "manifests/"));
    var compilerReport = {};

    console.log(clistyle.dirInput("> Input directory:  '" + inputDirPath));
    console.log(clistyle.dirOutput("< Output directory: '" + outputDirPath));

    if (program.info) {
	console.log(JSON.stringify(TOOLS_META, undefined, 4));
	console.log(JSON.stringify(ARC_CORE.__meta, undefined, 4));
	break; // bounce
    }

    console.log(clistyle.processStepHeader("> Enumerating input files..."));

    var enumResponse = FILE_DIR_ENUMERATOR.request({
	parentDirectory: inputDirPath,
	fileCallback: function(path_) {
            var pathParse = PATH.parse(path_);
            var include = ((pathParse.ext === ".js") || (pathParse.ext === '.json'));
            if (include) {
                console.log("... discovered '" + clistyle.fileInput(path_) + "'");
            }
            return include;
	}
    });

    if (enumResponse.error) {
	errors.push(enumResponse.error);
	break; // bounce
    }

    if (enumResponse.result.files.length === 0) {
	console.log("Found no files at and below '" + inputDirPath + "' to evaluate?");
	break; // bounce
    }

    compilerReport.inputResourceFiles = enumResponse.result.files.length;

    console.log(clistyle.processStepHeader("> Attempting to load " + compilerReport.inputResourceFiles + " discovered files as JavaScript/JSON..."));

    var resources = [];

    compilerReport.inputResourceLoads = 0;
    enumResponse.result.files.forEach(function(filepath_) {
	console.log("... loading '" + clistyle.fileInput(filepath_) + "'");
	var loaderResponse = FILE_JSRC_LOADER.request(filepath_)
	var record = {
            origin: filepath_,
            error: loaderResponse.error,
            result: !loaderResponse.error?loaderResponse.result.resource:null
	};
	resources.push(record);
	if (!record.error) {
            compilerReport.inputResourceLoads++;
	} else {
	    errors.push(record);
	}
    });

    if (compilerReport.inputResourceLoads === 0) {
	console.log("Found no JavaScript or JSON resource files to evaluate?");
	break; // bounce
    }

    console.log(clistyle.processStepHeader("> Evaluating " + compilerReport.inputResourceLoads + " in-memory JavaScript/JSON resources..."));

    var specifications = []
    compilerReport.inputSpecLoads = 0;
    resources.forEach(function(resourceRecord_) {
	if (resourceRecord_.error) {
            console.log("... skipping non-JavaScript/JSON file '" + resourceRecord_.origin);
            return;
	}
	console.log("... parsing '" + clistyle.fileInput(resourceRecord_.origin) + "'");
	specLoaderResponse = SPEC_LOADER.request(resourceRecord_.result);
	var record = {
            origin: resourceRecord_.origin,
            error: specLoaderResponse.error,
            result: !specLoaderResponse.error?specLoaderResponse.result:null
	};
	specifications.push(record);
	if (!specLoaderResponse.error) {
            compilerReport.inputSpecLoads++;
	} else {
	    errors.push(record);
	}
    });

    console.log(clistyle.processStepHeader("> Discovered " + compilerReport.inputSpecLoads + " specification files. Starting compilation..."));

    var manifests = []
    compilerReport.inputSpecCompiles = 0;
    specifications.forEach(function(specificationRecord_) {
	if (specificationRecord_.error) {
            console.log("... skipping unknown JavaScript/JSON file '" + specificationRecord_.origin + "'");
            return;
	}
	console.log("... parsing '" + clistyle.fileInput(specificationRecord_.origin) + "'");
	filterDAGFactoryResponse = ARC_CORE.filterDAG.create(specificationRecord_.result);
	var record = {
            origin: specificationRecord_.origin,
            error: filterDAGFactoryResponse.error,
            result: !filterDAGFactoryResponse.error?filterDAGFactoryResponse.result:null
	};
	manifests.push(record);
	if (!filterDAGFactoryResponse.error) {
            compilerReport.inputSpecCompiles++;
	} else {
	    errors.push(record);
	}
    });

    console.log(clistyle.processStepHeader("> Generated " + compilerReport.inputSpecCompiles + " manifests. Writing outputs..."));

    compilerReport.manifestsWritten = 0;
    manifests.forEach(function(manifestRecord_) {
	if (manifestRecord_.error) {
            console.log("... no manifest produced for resource file '" + clistyle.fileInput(manifestRecord_.origin) + "'");
            return;
	}
	var filePath = PATH.join(outputDirPath, "filterdag-manifest-" + manifestRecord_.result.dagID + ".json");
	console.log("... writing FilterDAG manifest '" + clistyle.fileOutput(filePath) + "'");
	var fileWriter = FILE_RC_WRITER.request({
            path: filePath,
            resource: JSON.stringify(manifestRecord_.result, undefined, 4)
	});
	if (fileWriter.error) {
            console.log("! File write error: " + fileWriter.error);
	    errors.push({ origin: manifestRecord_.origin, dest: filePath, error: fileWriter.error, result: fileWriter.result });
	} else {
            compilerReport.manifestsWritten++;
	}
    });
    break;

} // while (!bounce)

if (errors.length) {
    console.log(clistyle.errorReportHeader("Error Report:"));
    console.log(clistyle.errorReportErrors(JSON.stringify(errors, undefined, 4)));
}

if (compilerReport.inputResourceFiles > 0) {
    console.log(clistyle.compilerSummaryHeader("\n> Compiler summary:"));
    console.log(clistyle.compilerSummaryData(JSON.stringify(compilerReport)));
}





