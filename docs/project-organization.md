---
id: project-organization
title: Project Organization
sidebar_label: Project Organization
---

Stage Director doesn't require any specifc directory structure, but there are some best practices that we've found help keep things organized. Exactly how you organize your Stage Director project depends on how you're using Stage Director, and what other libraries and frameworks you're using it in conjuction with. We'll walk you through a few common scenarios here as well as highlighting some general principles to help you determine the best setup for your use case.

## Pure Stage Director

```bash
project-root
    ├── package.json
    ├── config
    └── src
        ├── store.js
        ├── directors
        │   └── index.js
        └── selectors
```

## Stage Director and Vanilla Redux

```bash
project-root
    ├── package.json
    ├── config
    └── src
        ├── store.js
        ├── directors
        │   └── index.js
        └── selectors
```

## Stage Director with React

```bash
project-root
    ├── package.json
    ├── config
    └── src
        ├── store.js
        ├── directors
        │   └── index.js
        └── selectors
```
