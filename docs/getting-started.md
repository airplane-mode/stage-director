---
id: getting-started
title: Getting Started
sidebar_label: Getting Started
---

Getting started with Stage Director is simple. We'll walk you through the process of installing stage director, creating your first director, hooking it up to your redux store, and dispatching actions.

## Installation

```bash
npm install --save stage-director
```

## Consuming the Module

If you're using a version of javascript or a cross-compiler that supports the `import` keyword, the easiest way to consume Stage Director is:

```javascript
import StageDirector from "stage-director";
```

If you're using a system that uses the `require` keyword, such as stable nodejs, you can require Stage Director with:

```
const StageDirector = require("stage-director").default;
```

## Your First Director

Let's write a director that implements the action, action creator, and reducer to update a slice of the state named `"my-first-director"` with whatever message it's given in it's payload:

```javascript
import StageDirector from "stage-director";

export default new StageDirector("my-first-director", {
  updateMessage: (state, { message }) => ({
    message
  })
});

```

## Connecting to Redux

Directors export a `reducers` field that lets you access their reducers directly. You can use this to connect to your redux store just as you would in any standard redux app:

```javascript
import { createStore } from "redux";
import { reducers } from "./directors/my-first-director";

const initialState = {
  "my-first-director": {
    message: null
  }
};

const store = createStore(reducers, initialState);

export default store;
```

## Dispatching Actions

Directors export an `actions` field that lets you access their action creators. You can use these just as you'd use any action creator in conjuction with redux's `dispatch` method.

```javascript
import store from "./store";
import myFirstDirector from "./directors/my-first-director";

store.dispatch(myFirstDirector.actions.update({ message: "Hello, world!" }));
```


## Next Steps

From here you can learn more about Stage Director's [core concepts](core-concepts.md), start learning how to use it's [async support](async.md), or dig into the [API docs](api.md) directly.
