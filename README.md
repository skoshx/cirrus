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

- Automatically sets up domains with SSL
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
$ cirrus init my-app
```

Then, on your local machine:

```bash
$ git remote add deploy https://<your vps ip>/
```

```bash
$ git push deploy main # deploy!
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

- Tests

  - get logs, get project, get deployments tests

- Good error reporting

  - All errors should have some explanation or possible solution
  - Also have the error

- Remove port option (user shouldn't need to think about ports…)

- Somehow we need to separate the project config from the GitHub...

  - It was a nice idea, but isn't in line with cirrus long term goals of no config
  - Maybe a `cirrus/config/appname.json` file that gets overridden if repo contains `cirrus.json` file
  - This loops back to the removing port thing… if we want to remove port option, we still need
    to keep track of it so that it doesn't keep changing…

- Plugins

  - Plugins can insert ENV variables to all programs; for instance, if we have POSTGRES plugin, then maybe we have a `POSTGRES_CONNECTION_URL` env variable passed to all programs. What ENV variables are exposed needs to be documented by the plugin.
  - Automatic Caddy server configuration plugin
    - Add path to CERT files to ENV
    - domain is determined in DEPLYOMENT section,
  - Automatic Postgres configuration plugin
    - Add connection url to ENV
  - Firewall setup plugin

- Add possibility to init from github
  [Instructions](https://github.com/railwayapp/starters/tree/master/examples/umami)

```bash
$ cirrus init umami-software/umami
$ cirrus init railwayapp/blog
```

- Ignore paths (low priority)

[![DigitalOcean Referral Badge](https://web-platforms.sfo2.digitaloceanspaces.com/WWW/Badge%202.svg)](https://www.digitalocean.com/?refcode=c8178a5d5ec6&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge)
