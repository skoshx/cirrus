<h1 align="center" style="font-weight: bold">☁️ Cirrus</h1>

<div align="center">

Cirrus is a push to deploy tool written above the cirrus clouds. Inspired by Evan You's pod.

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/skoshx/cirrus/blob/main/LICENSE.md)
[![build](https://github.com/skoshx/cirrus/actions/workflows/ci.yml/badge.svg)](https://github.com/skoshx/cirrus/actions/workflows/ci.yml)
[![prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
<br />
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/skoshx/cirrus/blob/main/CONTRIBUTING.md#pull-requests)

</div>

<p align="center">
<img src="docs/carbon-improved.png" width="688" />
</p>

## Install

```bash
$ yarn global add cirrus2
```

or with npm

```bash
$ npm install -g cirrus2
```

## Features

- Monorepo support out of the box
- Plugins

## Available commands

#### **`create`**

allows you to create a cloud app either from a local repository or a GitHub remote.

Options<br />
`--port, -p` Port to use for your app<br />
`--environment, -e` Path to an .env file to source when creating app<br />
`--remote, -r` Port to use for your app<br />

TODO: Write the rest

## Usage

First, log in to your Virtual Private Server. [DigitalOcean offers VPS' for only 5$/mo.](https://m.do.co/c/c8178a5d5ec6)

```bash
$ ssh root@<ip>
```

Install Node.js

```bash
$
```

Install Cirrus

```bash
$ npm install -g cirrus
```

Setup Cirrus. This step sets up necessary firewalls etc.

```bash
$ cirrus setup
```

Create an app.

```bash
$ cirrus create my-app --port 3000 <options>
```

Then, on your local machine:

```bash
$ git remote add deploy https://<your vps ip>/
```

## Docs

**TODO: Write docs**

## Contributing

All contributions are welcome! Please read below for guidelines on how to get started.

#### Feature request

If you want to propose a new feature, open an issue.

#### Found a bug?

1. [Fork](https://help.github.com/articles/fork-a-repo/) this repository to your own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local device
2. Link the package to the global module directory: `npm link`
3. Within the module you want to test your local development instance of `cirrus`, just link it to the dependencies: `npm link cirrus`. Node.js will now use your local clone of `cirrus`!

## License

Cirrus is released under the [MIT License](https://opensource.org/licenses/MIT).

## TODO

2 approaches

GitHub pull with Webhooks

Setup:
-> cirrus init skoshx/reponame -> Get access with github personal access token… (kind of struggle)
-> this does git clone
-> setup github webhook (kind of struggle)
-> push to github, and everything gets magically deployed…
-> what if access token expires?

Git repository on server --> I think we're going with this…
-> cirrus init projectname
-> creates bare git repo
-> on user's local machine `git remote add deploy ssh://someip.com/srv/repo.git` (kind of struggle)
-> to deploy, `git push deploy`

- A function for checking validity of a project file (non-conflicting project names, non conflicting ports)

- Cirrus project file inside GitHub repo (project name cannot have spaces)
- How do we inject/store environment variables?
  -> we can just have one file with all needed .env variables
  -> one .env file for stuff added by cirrus as well as plugins
  -> .env file for each project like `mywebsite.env` , loaded accordingly
- Project file can have multiple deployments (monorepo support)
- Deployments can have ignore paths? (low priority)
- Deployments do following 1) git pull 2) run any commands specified in deployment, catching errors and reporting them in user-friendly way. 3) open any ports / firwall (this should be done with a plugin?) 4) Setup domain with Caddyserver if needed…
- Plugins
  - Plugins work in such a way: Plugins are ever-present, passed to all functions `create`, `delete`, `createHook`, and then the plugin is called after all transformations are made…
  - Plugins can insert ENV variables to all programs; for instance, if we have POSTGRES plugin, then maybe we have a `POSTGRES_CONNECTION_URL` env variable passed to all programs. What ENV variables are exposed needs to be documented by the plugin.
  - Automatic Caddy server configuration plugin
    - Add path to CERT files to ENV
    - domain is determined in DEPLYOMENT section,
  - Automatic Postgres configuration plugin
    - Add connection url to ENV
  - Firewall setup plugin
- Improved docs
- Tests

[![DigitalOcean Referral Badge](https://web-platforms.sfo2.digitaloceanspaces.com/WWW/Badge%202.svg)](https://www.digitalocean.com/?refcode=c8178a5d5ec6&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)
