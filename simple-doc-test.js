
var ARCCORE = require('../arccore');
var DOCGENFILTER = require('./arc_tools_lib_filter_doc_gen');

var docTemplate = "<h1>{{filterDescriptor.operationID}}</h1>";

var filterResponse = DOCGENFILTER.request({
    filter: DOCGENFILTER,
    template: docTemplate
});



