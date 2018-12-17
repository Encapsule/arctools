"use strict";

var TOOLSLIB = require('./arc_tools_lib');

var FILTERLIB = TOOLSLIB.arccore.filter;
var filterlibResponse = FILTERLIB.create({
  operationID: "okYViiI-TFampiKJ28nQ4Q",
  operationName: "ARC Project Constructor",
  operationDescription: "Constructs a new ARC Project JSON document.",
  inputFilterSpec: {
    ____label: "ARC Project Descriptor",
    ____description: "Configuration data for Encapsule arc_* command line tools suite.",
    ____types: "jsObject",
    ____defaultValue: {},
    name: {
      ____accept: ["jsUndefined", "jsString"]
    },
    description: {
      ____accept: ["jsUndefined", "jsString"]
    },
    agent: {
      ____types: "jsObject",
      ____defaultValue: {},
      name: {
        ____accept: "jsString",
        ____defaultValue: TOOLSLIB.meta.name
      },
      version: {
        ____accept: "jsString",
        ____defaultValue: TOOLSLIB.meta.version
      }
    },
    options: {
      ____types: "jsObject",
      ____defaultValue: {}
    },
    directories: {
      ____types: "jsArray",
      ____defaultValue: [],
      element: {
        ____accept: "jsString"
      }
    },
    projectState: {
      ____accept: "jsObject",
      ____defaultValue: {}
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
      var innerResponse = TOOLSLIB.arccore.graph.directed.create({
        name: TOOLSLIB.arccore.identifier.irut.fromEther(),
        description: "arctools project state cache"
      });

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
  }
});

if (filterlibResponse.error) {
  throw new Error(filterlibResponse.error);
}

module.exports = filterlibResponse.result;