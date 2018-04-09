# `reactivecore`

[![npm version](https://badge.fury.io/js/%40appbaseio%2Freactivecore.svg)](https://badge.fury.io/js/%40appbaseio%2Freactivecore)

This is the platform agnostic core architecture of reactive UI libraries.

## Installation

```
yarn add @appbaseio/reactivecore
```


## Usage and documentation

### Create store:

```
import configureStore from "@appbaseio/reactivecore";
```


### Supported actions:

Import via:

```
import { <actionName> } from "@appbaseio/reactivecore/lib/actions"
```

| Action					| Usage													|
|---------------------------|:------------------------------------------------------|
| `addComponent`			| to register a component in the store					|
| `removeComponent`			| to remove a component from the store					|
| `watchComponent`			| to set up component subscription						|
| `setQuery`				| to set the component query in the store				|
| `setQueryOptions`			| to add external query options							|
| `logQuery`				| Executed automatically to log query for gatekeeping	|
| `executeQuery`			| Executed automatically (whenever necessary, based on the dependency tree) when the query of a component is updated|
| `updateHits`				| updates results from elasticsearch query				|
| `updateQuery`				| to update the query in the store - called when a change is triggered in the component|
| `loadMore`				| for infinte loading and pagination					|


### Utility methods

Import via:

```
import { <methodName> } from "@appbaseio/reactivecore/lib/utils"
```

| Method				| Usage														|
|-----------------------|:----------------------------------------------------------|
| `isEqual`				| Compare two objects/arrays								|
| `debounce`			| Standard debounce											|
| `getQueryOptions`		| returns applied query options (supports `size` & `from`)	|
| `pushToAndClause`		| Pushes component to leaf `and` node. Handy for internal component registration |
| `checkValueChange`	| checks and executes before/onValueChange for sensors		|
| `getAggsOrder`		| returns aggs order query based on `sortBy` prop			|
| `checkPropChange`     | checks for props changes that would need to update the query via callback		|
| `checkSomePropChange`	| checks for any prop change in the propsList and invokes the callback			|

## Changelog

Check the [Changelog](./CHANGELOG.md) doc
