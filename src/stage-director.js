// Stage Director
// ===
//
// **Stage Director** is a tiny library that simplifies redux development.
//
// It allows the construction of *directors*. Directors encapsulate the the functionality
// of actions, action creators, and reducers in traditional redux apps.
//
// Its only dependency is the combineReducers() function from redux.
//
import { combineReducers } from "redux";

//
// StageDirector class
// ---------------------------
//
// The StageDirector class allows the construction of new directors,
// as well as providing some static methods to make the combining directors
// and using them with your redux store easy.
//
export default class StageDirector {
  //
  // **Construct a new stage director using:**
  //
  // `const myDirector = StageDirector.new("my-director", { ...definitions });`
  //
  // The *name* argument specifies the prefeix that will be generated for you action types
  // as well as the name of the slice of your redux store that this director will operate
  // on.
  //
  // Each action will have it's type formatted as:
  //
  // *director-name:action-name*
  //
  // Some actions, such as those associated with reducing the result of an asynchronous
  // action, have an addition sub-action name, and are of the form:
  //
  // *director-name:action-name:sub-action-name*
  //
  // The *definitions* defines the actions, action creators, and reducers that this
  // director will implement on the named slice.
  //
  constructor(name, definitions) {
    this.name = name;

    //
    // We run through the definitions we were given and use them to build up our actual actions.
    //
    // Actions definitions can come in one of two formats:
    //
    // 1. A pure function of the form state => newState
    // 2. An object, useful for defining asynchronous actions and associated 'callback' actions
    //
    //
    const definitionKeys = Object.keys(definitions);
    this.actions = {};
    definitionKeys.forEach(key => {
      const definition = definitions[key];

      //
      // In the case of pure functions, we simply create an action that takes a payload
      // and returns a new payload with the appropriate type key included.
      //
      if(typeof(definition) === "function") {
        this.actions[key] = (payload = {}) => ({
          ...payload,
          type: makeKey(name, key)
        });

      //
      // In the case of an object, we require two fields:
      //
      // 1. A create or async directive
      // 2. A reduce definition
      //
      } else if(typeof(definition) === "object") {
        // if we don't have a reduce definition, we throw an Error
        if(!definition.reduce) {
          throw new Error("A reducer field is required for an object-based action definition, but none was given");
        }

        //
        // Create directives allow us to transform our payload when our action is created,
        // as such the create value should be a function that takes a payload and transforms
        // it into the payload we want to include in our action:
        //
        // payload => newPayload
        //
        if(definition.create) {
          this.actions[key] = (payload = {}) => ({
            ...definition.create(payload),
            type: makeKey(name, key)
          });

        // Async directives allow us to create asynchronous actions compatible with redux-thunk.
        } else if(definition.async) {
          this.actions[key] = (payload = {}) => {
            return (dispatch, getState) => {
              if(typeof(definition.reduce) === "function") {
                definition.async((innerPayload) => dispatch({
                  ...innerPayload,
                  type: makeKey(name, key)
                }), payload, dispatch, getState);
              } else {
                const done = {};
                Object.keys(definition.reduce).forEach(reduceKey => {
                  done[reduceKey] = (innerPayload) => dispatch({
                    ...innerPayload,
                    type: makeKey(name, key, reduceKey)
                  });
                });
                definition.async(done, payload, dispatch, getState);
              }
            };
          };

        // if the definition doesn't have an async or create directive, we thow an error
        } else {
          throw new Error("Object-based action definitions require either an object field or an async field, but neither was given");
        }

      // if the definition isn't a function or an object, we throw an error
      } else {
        throw new Error(`Definitions must be either a function or an object, but we were given ${typeof(definition)}`);
      }
    });

    // We now create our reducer(s)
    this.reducer = (state = {}, payload) => {
      for(let i = 0; i < definitionKeys.length; i++) {
        const key = definitionKeys[i];
        const definition = definitions[key];
        const baseType = getBaseKey(payload.type);
        if(baseType === makeKey(name, key)) {
          if(typeof(definition) === "function") {
            return definition(state, payload);
          }
          if(typeof(definition.reduce) === "function") {
            return definition.reduce(state, payload);
          }
          const subreducerKeys = Object.keys(definition.reduce);
          const subkey = getSubKey(payload.type);
          if(!subkey) {
            throw new Error(`Action ${payload.type} doesn't specify a subreducer, but should be one of: ${subreducerKeys.join(",")}`);
          }
          if(!definition.reduce[subkey]) {
            throw new Error(`Action ${payload.type} has subkey ${subkey}, but should be one of: ${subreducerKeys.join(",")}`);
          }
          return definition.reduce[subkey](state, payload);
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
}

// Helpers and Constants
// --------------------------
//
// Given a namespace (the name of the director), action name, and optionally subaction name,
// we'll make keys of the form:
//
// *namespace:action-name:sub-action-name*
//
// The seperator, ":", currently isn't configurable, though in the future that may change.
//
const SEP = ":";
const makeKey = (namespace, actionName, subActionName) => {
  if(subActionName) {
    return `${namespace}${SEP}${actionName}${SEP}${subActionName}`;
  }
  return `${namespace}${SEP}${actionName}`;
};

//
// We get the *base key*, which is the director-name:action-name key, by parsing the entire
// key and rebuilding it without anything after the first two parts.
//
const getBaseKey = (key) => {
  const parts = key.split(SEP);
  return `${parts[0]}${SEP}${parts[1]}`;
};

//
// We get the *subkey*, which is the sub-action name, by getting the third element.
// If there is no third element, we return null here.
//
const getSubKey = (key) => {
  return key.split(SEP)[2];
};
