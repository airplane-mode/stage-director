---
id: project-organization
title: Project Organization
sidebar_label: Project Organization
---

Stage Director doesn't require any specific directory structure, but there are some best practices that we've found help keep things organized. Exactly how you organize your Stage Director project depends on how you're using Stage Director, and what other libraries and frameworks you're using it in conjuction with. We'll walk you through a few common scenarios here as well as highlighting some general principles to help you determine the best setup for your use case.

## Pure Stage Director

The simplest setup for a Stage Director project is one that only uses Stage Director to manage your state. This is generally a new project that you've started with Stage Director in mind from the beginning, or an old project that you've refactored to completely rely on Stage Director for state management. Note that if you're transitioning from a vanilla Redux project to a pure Stage Director project, it probably makes sense to take things one step at a time and incrementally refactor pieces of your existing project rather than trying to switch everything over at once. For a setup that makes it easy to use Stage Director and Vanilla Redux together, see the [next section](#stage-director-and-vanilla-redux).

For pure Stage Director projects, we recommend something along the lines of the following project structure:

```bash
project-root
    ├── package.json
    ├── config
    └── src
        ├── index.js
        ├── store.js
        ├── directors
        │   └── index.js
        └── selectors
```

This setup addresses the three essential parts of a Stage Director based app: **set up** via `index.js` and `store.js`, **reads** via `selectors/*`, and **writes** via `directors/*`. Let's walk through each of these pieces individually.

### Set Up

To get Stage Director set up along with our redux store we need to look at two files: `index.js`, which will be the entry point into our app as well as responsible for setting up our initial state, and `store.js`, which will be responsible for setting up a redux store and a connecting Stage Director to it. Let's look at a sample `index.js`:

```javascript
import configureStore from "./store"; // get our store configuration function

// set up the initial state
const initialState = {
  users: { }, // this 'slice' of the state can be whatever you want, it will correspond to a director
  permissions: { } // you can have as many slices as you like, each will need a director and some selectors
};

// get the actual redux store, which we can then use however we like
const store = configureStore(initialState);
```

Now we can take a look at our `store.js` which will do the actual setup:

```javascript
import { createStore, applyMiddleware } from "redux";                                  
import thunk from "redux-thunk";                                                       
import { reducer } from "./directors";                                                 
import { composeWithDevTools } from 'redux-devtools-extension'                         
                                                                                       
export default(initialState) => {                                                      
  return createStore(reducer, initialState, composeWithDevTools(applyMiddleware(thunk)));
}
```

This is a bit more complicated, but if we break it down hopefully it will become clear what's happening. At a high level, all we're doing is exporting a function that takes an initial state and produces a standard redux store with two pieces of middleware attached: [redux-thunk](https://github.com/reduxjs/redux-thunk) and [redux-devtools-extension](http://extension.remotedev.io/#installation), and we're passing it the root reducer that we got from Stage Director. We'll look at how to set up your directors so that this reducer is actually available in just a minute, but first it's worth noting that you can skip the devtools extension if you want, but assuming that you want to use StageDirector's [async support](async.md), redux-thunk is required.


### Directors

Now let's get into the meat of this project, the directors. In our setup example we created two "slices" of our state: `users` and `permissions`. Let's set up our `src/directors/` directory to reflect that fact:

```bash
directors
    ├── index.js
    ├── users.js
    └── permissions.js
```

You may notice that as well as having files for our `users` and `permissions` directors, we've also got an `index.js`. This will be used to roll up all of our directors and export a single root reducer so that it can be used to set up the store in `store.js` as [seen above](#set-up).

Let's take a look at `index.js`:

```javascript
import StageDirector from "stage-director";

import users from "./users";
import permissions from "./permissions";

const rootDirector = StageDirector.combine({
  users,
  permissions
});

const actions = rootDirector.actions;
const reducer = rootDirector.reducer;

export {
  actions,
  reducer
};
```

Here we use StageDirector's static `combine()` method to take all of our specific directors and produce one combined root director, which in turn provides us with a root reducer that we can use when configuring our store.

We won't look at the specifics of the individual directors here, for more details on how to write a director take a look at the documentation [here](core-concepts#directors).


### Selectors

Selectors aren't a built-in part of Stage Director, nor or they strictly required for Stage Director to function, but we've found that they can help to keep things organized and add a useful layer of indirection between your data model and your reads of that data model - particularly useful if your model is [normalized](http://extension.remotedev.io/#installation) and you don't want to always be thinking about that fact when accessing your data.

A good general setup is one selector file, consisting of an exported object that contains a number of selector methods, per director. In this example that would mean our selectors directory would look like:

```bash
selectors
    ├── users.js
    └── permissions.js
```

## Stage Director and Vanilla Redux

Using Stage Director alongside Vanilla Redux actions/reducers/etc is actually fairly straightforward and only requires a single change to the standard [pure Stage Director setup](#pure-stage-director) to get working.

Let's look at what our project structure might look like:

```bash
project-root
    ├── package.json
    ├── config
    └── src
        ├── index.js
        ├── store.js
        ├── actions
        │   └── vanilla.js
        ├── reducers
        │   └── vanilla.js
        ├── action-creators
        │   └── vanilla.js
        ├── directors
        │   ├── permissions.js
        │   └── users.js
        └── selectors
```

Here we've added our standard redux project directories - `actions`, `reducers`, and `action-creators` - to our Stage Director project structure. Note that the specifics don't actually matter here, if your redux project uses a different layout that's fine. Just merge it with the standard Stage Director structure making sure that you have a `store.js` or equivalent place to do your store setup.

Note that in this merged structure we forego `src/directors/index.js` - the file previously responsible for rolling up all of our directors into a root director. This is because we'll be doing the rollup slightly differently in order to allow ourselves to include the vanilla reducers as well.

To do this we need to update `store.js` to provide the store with a root reducer that combines both our Stage Director derived reducers and our vanilla redux reducers. There are several ways to go about this, but the simplest is to just use redux's `combineReducers()` function like so:

```javascript
import { createStore, applyMiddleware, combineReducers } from "redux";                                  
import thunk from "redux-thunk";                                                       
import users from "./directors/users";
import permissions from "./directors/permissions";
import vanilla from "./reducers/vanilla";
import { composeWithDevTools } from 'redux-devtools-extension'                         

// use combineReducers to combine our Stage Director-derived reducers with
// other vanilla reducers found in the project
const reducer = combineReducers({
  users: users.reducer,
  permissions: permissions.reducer,
  vanilla
})
                                                                                       
export default(initialState) => {                                                      
  return createStore(reducer, initialState, composeWithDevTools(applyMiddleware(thunk)));
}
```

## Stage Director with React

Stage Director integrates with react in the exact same way [redux does](https://react-redux.js.org/introduction/quick-start), since Stage Director is just syntactic sugar and automation on top of redux. There are lots of ways to do this, but here's the most straightforward (direct from the `react-redux` docs):

```javascript
import React from 'react'
import ReactDOM from 'react-dom'

import { Provider } from 'react-redux'
import store from './store'

import App from './App'

const rootElement = document.getElementById('root')
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  rootElement
)
```

## Next Steps

From here you can learn more about how to use Stage Director's [async support](async.md) to make building asynchronous control flows painless, or you might be interested in digging deeper into project organization with Stage Director and learning about how to [share logic between actions](sharing-logic.md).
