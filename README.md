# Stage Director

Stage Director is a tiny library (~100 lines of code) that simplifies redux development.

## ¡¡¡BETA NOTICE!!!

Stage Director is currently in beta with a planned release in late 2018. We are currently using Stage Director in two projects, but there are other use cases that we have not explored (or debugged) yet. Please report any issues you might find, submit pull requests, and test thoroughly in development before using in any production environment.

## Motivation

Redux is a great way of managing application state, but for many common use cases it requires a lot of plumbing: actions, action creators, and reducers, spread across multiple files, usually in multiple directories. 

Stage Director was created by @airshanemode and @jfyles for [Mr. Farnell's Curious Jaunts](http://curiousjaunts.co.uk) to provide a streamlined API for working with redux. It reduces the complexity of managing application state and asynchronously interfacing with external APIs so that you can focus on the logic that makes your application amazing.

## Installation

`npm install --save stage-director`

## Usage

Stage Director introduces the notion of "directors". These are files that define reducers, action creators, and actions all in the same place.

### A simple example

Let's start with a simple login / logout example. In traditional redux, you might have an actions file that contains the actions and action creators that are required to trigger the reducer that will manage whether a user is logged in or logged out. It might look something like this.

```javascript
export const ACTION_TYPES = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT'
};

const actionCreators = {
  login: (username) => (
    {
      type: ACTION_TYPES.LOGIN,
      username
    }
  ),
  logout: () => (
    {
      type: ACTION_TYPES.LOGOUT
    }
  ),
};

export const ACTION_CREATORS = actionCreators;
```

This contains a bunch of redundant boilerplate code, including replicating the name of each action four times.

Additionally, you'd have a reducer file that checks for certain actions, and modifies the state accordingly. That file might look something like this.

```javascript
import { ACTION_TYPES } from '../actions/index';

const account = (state = {}, action) => {
  switch (action.type) {
    case ACTION_TYPES.LOGIN:
      return {
        ...state,
        loggedIn: true,
        username: action.username
      };
    case ACTION_TYPES.LOGOUT:
      return {
        ...state,
        loggedIn: false,
        username: null
      };
    default:
      return state;
  }
};

export default account;
```

With Stage Director, we can reduce all of this logic into a single file that's smaller and easier to read than the aforementioned reducer itself.

```javascript
import StageDirector from "stage-director";

const account = new StageDirector("account", {
  login: (state, { username }) => ({
    ...state,
    loggedIn: true,
    username
  }),
  logout: (state) => ({
    ...state,
    loggedIn: false,
    username: null
  })
});

export default account;
```

At first glance, this looks a lot like a set of reducer definitions, and that's because in this case it is. Reducers are the heart of redux - they define how an action changes one state to another. In this case, all we really care about are the reducers, the rest - actions and action creators - can be inferred from the *structure* of the director. This director sees that we've just defined reducers, so it infers that we want standard actions and action creators to go with them, and it goes ahead and defines them for us.

Let's look through what it gives us:

First of all, `account.reducer` gives us a reducer that knows how to handle actions with `type === "account:login"` and `type === "account:logout"`. We can register this reducer directly with a store with something like:

```javascript
import { createStore } from "redux"

const store = createStore(account.reducer);
```

Or, as is likely, if we have a number of directors in our project, we can combine them with `StageDirector.combine()` - the rough equivalent of redux's `combineReducers()` - and pass the combined reducer to `createStore()`.


In this simple example we get our actions and action creators for free:

`account.actions.login({ username: "bob" })` yields `{ type: "account:login", username: "bob" }`, and calling `store.dispatch()` with that will invoke the correct reducer.

`account.actions.logout()` yields `{ type: "account:logout" }`.

Notice that the action types are namespaced by director, in this case "account". This means that we can safely use whatever action names make sense in the context of a given director without having to manually prepend things to common action names like "get" or "sync".

### Explicit creators

There are some cases where you'll want to do more in your action creator than simply create an action with the appropriate type. For example, you may want to extract a few fields from an object and expose those in the action. Stage Director lets you do this easily:

```javascript
import StageDirector from "stage-director";

const account = new StageDirector("account", {
  login: {
    create: (user) => ({
      friendCount: user.friends.length,
      username: user.username
    }),
    reduce: (state, { friendCount, username }) => ({
      ...state,
      loggedIn: true,
      username,
      friendCount
    })
  },
  logout: (state) => ({
    ...state,
    loggedIn: false,
    username: null
  })
});
```

In this example, we've broken the login definition into two parts:

1. An action creator that takes a user object, computes the number of friends it has and it's username and exposes them in an action
2. A reducer that takes those fields and the current state and uses them to produce a new state.

While this isn't always necessary, Stage Director provides the flexibility to do it when called for, or to let the library handle it when you just need something standard. As before, we can access the reducer through `account.reducer` and the actions through `account.actions.login()` and `account.actions.logout()`. Invoking this more complex login action, in this case by passing the entire `user` object, could be as simple as `account.actions.login(user)`. The director would pull the required fields as part of the action creator, and only expose `friendCount` and `username` to the reducer.

### Asynchronous actions

Stage Director has support for `redux-thunk` style asynchronous actions out of the box, massively simplifying the development workflow of async code.

Here's a simple async example:

```javascript
import StageDirector from "stage-director";

const account = new StageDirector("account", {

  login: {
    async: (done, { username, password }) => ({
      fetch("/account/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      })
      .then(data => {
        if(data.authorized) {
          done.authorized({ username });
          return;
        }
        done.unauthorized();
      })
      .catch(error => {
        done.error(error);
      });
    }),
    reduce: {
      authorized: (state, { username }) => ({
        ...state,
        loggedIn: true,
        username
      }),
      unauthorized: (state) => ({
        ...state,
        unauthorizedAttempt: true
      }),
      error: (state, error) => ({
        ...state,
        error
      })
    }
  },

  logout: (state) => ({
    ...state,
    loggedIn: false,
    username: null
  })

});
```

In this example we've made the login action asynchronous. It makes a POST request to a backend endpoint with the supplied `username` and `password` parameters and, depending on the response, dispatches one of three actions: "account:login:authorized", "account:login:unauthorized", or "account:login:error", depending on the response that comes back, each of which has a corresponding reducer.

Notice that all of those additional response handling actions are created and namespaced automatically and properly, they're exposed to the async action through the `done` callback object, and all of the inversion of control and dispatching is handled automatically. No more trying to wrap your head around functions that return functions that take `dispatch` and then use it in their async callbacks to dispatch actions that you hand-roll for each response. Instead, just worry about your business logic in a clean, readible async flow.

As always, the login action creator is available through `account.actions.login({ username: "bob", password: "secret" })`.

The only additional step required to use async actions like this is applying the `redux-thunk` middleware when you create your store:

```javascript
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";

const store = createStore(account.reducer, {}, applyMiddleware(thunk));
```

## Closing remarks
Not only is hand-coding lots of boilerplate time consuming, it's also error prone. Action types can be typo'd, naming collisions can occur, and the mental strain of following what often amounts to one logical function across many files can lead to misunderstandings and bugs. This problem is even worse in the case of asynchronous redux code since asynchronous action usually has at least two followup actions - success and error - and often more. This causes the amount of code for a simple ajax call to balloon rapidly.

With Stage Director, developers can focus on core business logic instead of writing boilerplate.
