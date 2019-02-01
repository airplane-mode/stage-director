var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

import { combineReducers } from "redux";

export default class StageDirector {
  constructor(name, definitions) {
    this.name = name;

    // helpers for manipulating keys
    const SEP = ":";
    const makeKey = (namespace, actionName, subActionName) => {
      if (subActionName) {
        return `${namespace}${SEP}${actionName}${SEP}${subActionName}`;
      }
      return `${namespace}${SEP}${actionName}`;
    };
    const getBaseKey = key => {
      const parts = key.split(SEP);
      return `${parts[0]}${SEP}${parts[1]}`;
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
        this.actions[key] = (payload = {}) => _extends({}, payload, {
          type: makeKey(name, key)
        });
      } else if (typeof definition === "object") {
        if (!definition.reduce) {
          throw new Error(defError);
        }
        if (definition.create) {
          this.actions[key] = (payload = {}) => _extends({}, definition.create(payload), {
            type: makeKey(name, key)
          });
        } else if (definition.async) {
          this.actions[key] = (payload = {}) => {
            return (dispatch, getState) => {
              if (typeof definition.reduce === "function") {
                definition.async(payload => dispatch(_extends({}, payload, {
                  type: makeKey(name, key)
                })), payload, dispatch, getState);
              } else {
                const done = {};
                Object.keys(definition.reduce).forEach(reduceKey => {
                  done[reduceKey] = payload => dispatch(_extends({}, payload, {
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
    this.reducer = (state = {}, payload) => {
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
              throw new Error(`Action ${payload.type} doesn't specify a subreducer, but should be one of: ${subreducerKeys.join(",")}`);
            }
            if (!definition.reduce[subkey]) {
              throw new Error(`Action ${payload.type} has subkey ${subkey}, but should be one of: ${subreducerKeys.join(",")}`);
            }
            return definition.reduce[subkey](state, payload);
          }
        }
      }
      return state;
    };
  }

  static combine(directors, customCombine = null) {
    const actions = {};
    const reducers = {};
    Object.keys(directors).forEach(key => {
      actions[key] = directors[key].actions;
      reducers[key] = directors[key].reducer;
    });
    return {
      actions,
      reducer: (customCombine || combineReducers)(reducers)
    };
  }
};

// example:
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