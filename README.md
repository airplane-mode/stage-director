# Stage Director

Stage Director is a tiny library (~100 LOC) that simplifies redux development.

## Motivation

Redux is a great way of managing application state, but for many common use cases it requires a lot of plumbing: actions, action creators, and reducers, spread across multiple files, usually in multiple directories, to do simple things. Not only is hand-coding lots of boilerplate time consuming, it's also error prone. Action types can be typo'd, naming collisions can occur, and the mental strain of following what often amounts to one logical function across many files can lead to misunderstandings and bugs. This problem is even worse in the case of asynchronous redux code since asynchronous action usually has at least two followup actions - success and error - and often more. This causes the amount of code for a simple ajax call to balloon rapidly.

Stage Director provides a streamlined API for working with redux so developers can focus on core business logic instead of writing boilerplate.

## Installation

`npm install --save stage-director`

## Usage

Stage Director introduces the notion of "directors". These are files that define reducers, action creators, and actions all in the same place.

### A Simple Example

Here's a very simple director for managing account / login state:

```
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
```

This may look a lot like a set of reducer definitions, and that's because in this case it is. Reducers are the heaert of redux - they define how an action changes one state to another. In this case, all we really care about are the reducers, the rest - actions and action creators - can be inferred from the *structure* of director. This director sees that we've just defined reducers, so it infers that we want standard actions and action creators to go with them, and it goes ahead and defines them for us.

Let's look through what it gives us:

First of all, `account.reducer` gives us a reducer that knows how to handle actions with `type === "account:login"` and `type === "account:logout"`. We can register these reducers directly with a store with something like:

```
import { createStore } from "redux"

const store = createStore(account.reducer);
```

Or, as is likely, if we have a number of directors in our project, we can combine them with `StageDirector.combine()` - the rough equivalent of redux's `combineReducers()` - and pass the combined reducer to `createStore()`.


In this simple example we get our actions and action creators for free:

`account.actions.login({ username: "bob" })` yields `{ type: "account:login", username: "bob" }`, and calling `store.dispatch()` with that will invoke the correct reducer.

`account.actions.logout()` yields `{ type: "account:logout" }`.

Notice that the action types are namespaced by director, in this case "account". This means that we can safely use whatever action names make sense in the context of a given director without having to manually prepend things to common action names like "get" or "sync".

### Explicit Creators

There are some cases where you'll want to do more in your action creator than simply create an action with the appropriate type. For example, you may want to extract a few fields from an object and expose those in the action. Stage Director lets you do this easily:

```
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

While this isn't always necessary, Stage Director provides the flexibility to do it when called for, or to let the library handle it when you just need something standard. As before, we can access the reducer through `account.reducer` and the actions through `account.actions.login()` and `account.actions.logout()`.

### Asynchronous Actions

Stage Director has support for `redux-thunk` style asynchronous actions out of the box, massively simplifying the development workflow of async code.

Here's a simple async example:

```
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

In this example we've made the login action asynchronous. It makes a POST request a backend endpoint with the supplied username and password parameters and depending on the response dispatches one of three actions: "account:login:authorized", "account:login:unauthorized", or "account:login:error", depending on the response that comes back, each of which has a corresponding reducer.

Notice that all of those additional response handling actions are created and namespaced automatically and properly, they're exposed to the async action through the `done` callback object, and all of the inversion of control and dispatching is handled automatically. No more trying to wrap your head around functions that return functions that take `dispatch` and then use it in their async callbacks to dispatch actions that you hand-roll for each response. Just the meat, and a clean, readible async flow.

As always, the login action creator is available through `account.actions.login({ username: "bob", password: "secret" })`.

The only additional step required to use async actions like this is applying the `redux-thunk` middleware when you create your store:

``
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";


const store = createStore(account.reducer, {}, applyMiddleware(thunk));
```
