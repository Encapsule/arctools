"use strict";

var PATH = require('path');

var ARCTOOLSLIB = require('./arc_tools_lib');

var FILELOADER = ARCTOOLSLIB.jsrcFileLoaderSync;
var DOCGENFILTER = ARCTOOLSLIB.filterDocGenerate;
var filterDocTemplatePath = PATH.resolve(__dirname, 'templates', 'filter.hbs');
var loaderResponse = FILELOADER.request(filterDocTemplatePath);

if (loaderResponse.error) {
  console.error(loaderResponse.error);
  throw new Error(loaderResponse.error);
}

var filterResponse = DOCGENFILTER.request({
  filter: DOCGENFILTER,
  template: loaderResponse.result.resource
});
console.log(filterResponse.result);