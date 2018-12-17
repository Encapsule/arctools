"use strict";

var TOOLSLIB = require('./arc_tools_lib');

var FILTERLIB = TOOLSLIB.arccore.filter;
var filterlibResponse = FILTERLIB.create({
  operationID: "okYViiI-TFampiKJ28nQ4Q",
  operationName: "ARC Project Parser",
  operationDescription: "Parses a serialized ARC Project JSON document.",
  inputFilterSpec: {
    ____label: "ARC Project Descriptor",
    ____description: "Configuration data for Encapsule arc_* command line tools suite.",
    ____types: "jsObject",
    name: {
      ____accept: "jsString",
      ____defaultValue: ""
    },
    description: {
      ____accept: "jsString",
      ____defaultValue: ""
    },
    agent: {
      ____types: "jsObject",
      name: {
        ____accept: "jsString"
      },
      version: {
        ____accept: "jsString"
      }
    },
    options: {
      ____types: "jsObject"
    },
    directories: {
      ____types: "jsArray",
      element: {
        ____accept: "jsString"
      }
    },
    projectState: {
      ____accept: "jsObject"
    }
  },
  bodyFunction: function bodyFunction(request_) {
    var response = {
      error: null,
      result: null
    };
    var errors = [];
    var inBreakScope = false;

    while (!inBreakScope) {
      inBreakScope = true;
      var innerResponse = TOOLSLIB.arccore.graph.directed.create(request_.projectState);

      if (innerResponse.error) {
        errors.unshift(innerResponse.error);
        break;
      }

      response.result = request_;
      response.result.projectState = innerResponse.result;
      break;
    }

    if (errors.length) {
      response.error = errors.join(" ");
    }

    return response;
  },
  outputFilterSpec: {
    ____opaque: true
  }
});

if (filterlibResponse.error) {
  throw new Error(filterlibResponse.error);
}

module.exports = filterlibResponse.result;