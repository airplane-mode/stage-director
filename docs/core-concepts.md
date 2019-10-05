---
id: core-concepts
title: Core Concepts
sidebar_label: Core Concepts
---

In order to simplify redux development Stage Director introduces a few new concepts and uses terminology slightly differently than vanilla redux. It's important to understand these differences to get the most out of Stage Director and to avoid confusion.

While redux defines four core concepts, **action types**, **actions**, **action creators**, and **reducers**, Stage Director simplifies this to two: **directors** and **actions**.

In order to illustrate these concepts, let's walk through an example of an application that allows an administrator to manage user permissions. For the sake of simplicity we won't yet look at how to persist these permissions to the backend using [async actions](async.md).

## Directors

A **director** is a single instance of the StageDirector class. Each director encapsulates a specific set of concerns, and generally corresponds one-to-one with a slice of your redux store. Given this, there's often a one-to-one correspondence between director methods and redux [selectors](https://redux.js.org/recipes/computing-derived-data). You can think of directors as the "write" to selectors' "read" - a single director encapsulates the various write actions that you might want to perform on a single slice of your state.

In the context of our user example, we might organize our state like so:

```javascript
{
  "users": {
    "byId": {
      1: {
        id: 1,
        name: "Geoffrey Prentice",
        permissions: {
          canPost: true,
          canEdit: true,
          canDelete: true
        }
      },
      2: {
        id: 2,
        name: "Tyrone Slothrop",
        permissions: {
          canPost: true,
          canEdit: false,
          canDelete: false
        }
      }
    }
  }
}
```

Note that we're using the recommended [normalized state shape](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape) here, organizing our users by id as well as including the id in the user objects themselves. This isn't strictly necessary for Stage Director to work, but it makes managing state easier as your data model gets more complex. When retrieving nested data from APIs, converting to this normalized format is easy with libraries like [normalizr](https://github.com/paularmstrong/normalizr).

Let's create a director that allows us to manipulate our user data. We'll follow the [recommended directory structure](project-organization.md) for Stage Director projects and place this in `src/directors/users.js`.

```javascript
import StageDirector from "stage-director";

const users = new StageDirector("users", {

  // given a userId and a name, update the appropriate user name
  updateName: (state, { userId, name }) => ({
    ...state,
    byId: {
      [userId]: {
        ...state[userId],
        name
      }
    }
  }),

  // given a userId, permission name, and true/false value,
  // update the appropriate permission
  updatePermission: (state, { userId, permissionName, value }) => ({
    ...state,
    byId: {
      [userId]: {
        ...state[userId],
        permissions: {
          ...state[userId].permissions,
          [permissionName]: value
        }
      }
    }
  })

});

export default users;
```

The keen observer may notice that this code contains a potential bug - it doesn't validate that the `userId` or `permissionId` is valid before making it's update to the state. This has been omitted for simplicity's sake, but it's covered in detail in the section on [validation and error handling](validation-and-errors.md).

Also note that we're using the traditional declarative spread-based reducer style here. Stage Director also supports imperative reducer styles, for more details on that see the section on [using Stage Director with immer](immer.md).

As mentioned above, you'd probably define a corresponding selector object in `src/selectors/users.js` to access this state:

```javascript
const SLICE_NAME = "users";

export default {

  // given an id, the user's name
  getUserName: (state, { userId }) => state[SLICE_NAME].byId[userId].name,

  // given a user id and a permission, get the value of that permission
  getPermission: (state, { userId, permissionName }) => (
    state[SLICE_NAME].byId[userId].permissions[permissionName]
  )
}

```

## Actions

Each definition that we pass to Stage Director is referred to as an **action**. This differs from the redux notion of an action, which is just an object to be dispatched and handled by a reducer or possibly by additional middleware that you've installed in your redux store. The Stage Director action encapsulates the redux notions of an action type, an action, an action creator, and a reducer into one unified entity.

Let's see exactly what that means and why that might be helpful by comparing our above director-based implementation to a more traditional redux solution to the same problem.

Our vanilla redux project will replace the `src/directors` directory with three seperate directories:
  - `src/action-types`
  - `src/action-creators`
  - `src/reducers`

First, we'll create a file at `src/action-types/users.js` to define our **action types** for manipulating users:

```javascript
export const UPDATE_USER_NAME = "UPDATE_USER";
export const UPDATE_USER_PERMISSION = "UPDATE_USER_PERMISSION";
```

Now we'll create a file at `src/action-creators/users.js` to define our corresponding **action creators**:

```javascript
import { UPDATE_USER_NAME, UPDATE_USER_PERMISSION } from "../action-types/users";

export function updateUser(userId, name) {
  return {
    type: UPDATE_USER_NAME,
    userId,
    name
  };
}

export function updateUserPermission(userId, permissionName, value) {
  return {
    type: UPDATE_USER_PERMISSION,
    userId,
    permissionName,
    value
  };
}
```

Finally, we'll create a file at `src/reducers/users.js` to define our corresponding **reducers**:

```javascript
import { UPDATE_USER_NAME, UPDATE_USER_PERMISSION } from "../actions-types/users";

export function userReducer(state, action) {
  switch(action.type) {
    case UPDATE_USER_NAME:
      return ({
        ...state,
        byId: {
          ...state.byId,
          [action.userId]: {
            ...state.byId[action.userId],
            name: action.name
          }
        }
      });
    case UPDATE_USER_PERMISSION:
      return ({
        ...state,
        byId: {
          ...state.byId,
          [action.userId]: {
            ...state.byId[action.userId],
            permissions: {
              ...state.byId[action.userId].permissions,
              [action.permissionName]: action.value
            }
          }
        }
      });
    default:
      return state;
  }
}
```

The first thing that probably jumps out about this implementation is the amount of boilerplate - we're defining action types, action creators, and reducers for every single conceptual "action" in our app. We also have to manually write the switch logic when deciding how to reduce our various action types, **even though this is always the same logic for every reducer in every redux app**.

The next thing that might jump out is the over-separation of concerns. Action types, action creators, and reducers are generally 1:1:1, but they're not grouped together into a single definition - to get the full picture for any of these logical units, we need to look at three separate files in three separate parallel directory structures. While it's *technically* possible that you could have multiple action creators for a single action, this tends to be a case of over-abstraction, and the benefits almost certainly don't outweigh the organizational complexity introduced to support this edge case. If this sort of decoupling is something you really need, Stage Director provides a cleaner solution to this, described in the section on [sharing action logic](sharing-logic.md).

Managing type names and dispatch logic over those type names isn't something that the developer should be tasked with for every action in their application. Stage Director handles all of that for you by grouping action type, action creator, and reducer into a single logical action definition. This frees the developer up to focus more on what each action does, rather than how redux enables that action to do what it wants to do.

It's worth noting that the redux project is well aware of it's boilerplate problem, and provides some recommendations for [reducing boilerplate](https://redux.js.org/recipes/reducing-boilerplate). In addition to these recommendations, the redux project has now officially endorsed the [Redux Starter Kit](https://redux-starter-kit.js.org/) which attempts to address and simplify a lot of these issues. While it's a good step, you can read more about why it may be insufficient for many use cases in the section comparing Stage Director to [alternative solutions](alternatives.md).

## Next Steps

From here you may be interested in reading more about the best practices for [organizing a project](project-organization.md) that uses Stage Director. Alternatively, you might want to jump ahead and start looking at how Stage Director's [async support](async.md) makes organizing complex asynchronous logic, such as fetching external resources and handling the results, easy.
