"use strict";

require("core-js/modules/es.string.split");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _redux = require("redux");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class StageDirector {
  constructor(name, definitions) {
    this.name = name; // helpers for manipulating keys

    const SEP = ":";

    const makeKey = (namespace, actionName, subActionName) => {
      if (subActionName) {
        return "".concat(namespace).concat(SEP).concat(actionName).concat(SEP).concat(subActionName);
      }

      return "".concat(namespace).concat(SEP).concat(actionName);
    };

    const getBaseKey = key => {
      const parts = key.split(SEP);
      return "".concat(parts[0]).concat(SEP).concat(parts[1]);
    };

    const getSubKey = key => {
      return key.split(SEP)[2];
    };

    const definitionKeys = Object.keys(definitions);
    this.actions = {};
    const defError = "Action definitions must be either a single function to use as a reducer or an object with 'create' and 'reduce' functions";
    definitionKeys.forEach(key => {
      const definition = definitions[key];

      if (typeof definition === "function") {
        this.actions[key] = function () {
          let payload = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
          return _objectSpread({}, payload, {
            type: makeKey(name, key)
          });
        };
      } else if (typeof definition === "object") {
        if (!definition.reduce) {
          throw new Error(defError);
        }

        if (definition.create) {
          this.actions[key] = function () {
            let payload = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            return _objectSpread({}, definition.create(payload), {
              type: makeKey(name, key)
            });
          };
        } else if (definition.async) {
          this.actions[key] = function () {
            let payload = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            return (dispatch, getState) => {
              if (typeof definition.reduce === "function") {
                definition.async(payload => dispatch(_objectSpread({}, payload, {
                  type: makeKey(name, key)
                })), payload, dispatch, getState);
              } else {
                const done = {};
                Object.keys(definition.reduce).forEach(reduceKey => {
                  done[reduceKey] = payload => dispatch(_objectSpread({}, payload, {
                    type: makeKey(name, key, reduceKey)
                  }));
                });
                definition.async(done, payload, dispatch, getState);
              }
            };
          };
        } else {
          throw new Error(defError);
        }
      } else {
        throw defError;
      }
    });

    this.reducer = function () {
      let state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      let payload = arguments.length > 1 ? arguments[1] : undefined;

      for (let i = 0; i < definitionKeys.length; i++) {
        const key = definitionKeys[i];
        const definition = definitions[key];
        const baseType = getBaseKey(payload.type);

        if (baseType === makeKey(name, key)) {
          if (typeof definition === "function") {
            return definition(state, payload);
          } else if (typeof definition.reduce === "function") {
            return definition.reduce(state, payload);
          } else {
            const subreducerKeys = Object.keys(definition.reduce);
            const subkey = getSubKey(payload.type);

            if (!subkey) {
              throw new Error("Action ".concat(payload.type, " doesn't specify a subreducer, but should be one of: ").concat(subreducerKeys.join(",")));
            }

            if (!definition.reduce[subkey]) {
              throw new Error("Action ".concat(payload.type, " has subkey ").concat(subkey, ", but should be one of: ").concat(subreducerKeys.join(",")));
            }

            return definition.reduce[subkey](state, payload);
          }
        }
      }

      return state;
    };
  }

  static combine(directors) {
    let customCombine = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    const actions = {};
    const reducers = {};
    Object.keys(directors).forEach(key => {
      actions[key] = directors[key].actions;
      reducers[key] = directors[key].reducer;
    });
    return {
      actions,
      reducer: (customCombine || _redux.combineReducers)(reducers)
    };
  }

}

exports.default = StageDirector;
; // example:

/*

const app = new StageDirector("app", {

  getUpcoming: {
    async: (done) => {
      setTimeout((err, result) => {
        if(err) {
          done.error(err);
          return;
        }
        done.success(result);
      }, 1000);
    },
    reduce: {
      success: (state, payload) => ({
        ...state,
        data: payload.data
      }),
      error: (state, payload) => ({
        ...state,
        error: payload.error
      })
    }
  },

  login: (state, payload) => ({
    ...state,
    loggedIn: true,
    username: payload.username
  })

});

store.dispatch(app.getUpcoming())
store.dispatch(app.login({ username: "shane" }));
*/