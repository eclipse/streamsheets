<h1 align="center">Welcome to the Streamsheet® core project</h1>

<div align="center">
	<!-- <a href="https://travis-ci.com/cedalo/streamsheets"
		><img
			alt="Travis Status"
			src="https://travis-ci.com/cedalo/streamsheets.svg?token=4V9Pi9sH4H9riNSqvsLP&branch=master"
	/></a> -->
	<a href="https://github.com/cedalo/streamsheets">
		<img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" target="_blank" />
	</a>
	<a href="https://github.com/cedalo/streamsheets/graphs/commit-activity">
		<img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" target="_blank" />
	</a>
	<br/>
	<a href="https://docs.cedalo.com/installation.html">
		<img alt="Platform" src="https://img.shields.io/badge/platform-linux%20%7C%20macos%20%7C%20win%20%7C%20rpi%20%7C%20node-blue.svg" target="_blank" />
	</a>
	<img alt="Version" src="https://img.shields.io/badge/version-2.0-blue.svg?cacheSeconds=2592000" />
	<img alt="Node.js version" src="https://img.shields.io/badge/node-%3E%3D%208.0.0-blue.svg" />
	<br/>
	<a href="https://forum.streamsheets.com">
		<img
			alt="Discourse: forum.streamsheets.com"
			src="https://img.shields.io/discourse/https/forum.streamsheets.com/topics.svg?style=social&logo=discourse"
			target="_blank"
		/>
	</a>
	<a href="https://forum.streamsheets.com">
		<img
			alt="Discourse: forum.streamsheets.com"
			src="https://img.shields.io/discourse/https/forum.streamsheets.com/users.svg?style=social&logo=discourse"
			target="_blank"
		/>
	</a>
	<a href="https://forum.streamsheets.com">
		<img
			alt="Discourse: forum.streamsheets.com"
			src="https://img.shields.io/discourse/https/forum.streamsheets.com/posts.svg?style=social&logo=discourse"
			target="_blank"
		/>
	</a>
	<!-- <a href="https://forum.streamsheets.com">
		<img
			alt="Discourse: forum.streamsheets.com"
			src="https://img.shields.io/discourse/https/forum.streamsheets.com/likes.svg?style=social&logo=discourse"
			target="_blank"
		/>
	</a> -->
	<a href="https://twitter.com/cedalo_com">
		<img
			alt="Twitter: cedalo_com"
			src="https://img.shields.io/twitter/follow/cedalo_com.svg?style=social"
			target="_blank"
		/>
	</a>
</div>

<br/>

The Streamsheet® core is an open-source tool for making your data immediately understandable and for creating IoT applications visually and interactively - without a single line of code.

<p align="center">
  <img src="assets/title.png">
</p>

If you are new to Streamsheets, you should start with the [introduction guide](https://docs.cedalo.com/introduction.html) or with the following video:

<p align="center">
  <a href="https://www.youtube.com/watch?v=fNJcIVSneH4
" target="_blank"><img src="assets/video.png" 
alt="Streamsheets" /></a>
</p>

Also, visit us on our [website](https://cedalo.com/) or check out the [Streamsheets forum](https://forum.streamsheets.com/).

## Table of contents

-   [Installation](#installation)
-   [Quick start](#quick-start)
-   [Documentation](#documentation)
-   [FAQ](#faq)
-   [License](#license)

## 🔌 Installation

### Using Docker and Docker Compose

There are Docker images available for installing Streamsheets on Linux, macOS, Windows and Raspberry Pi (tested with Raspbian). For each of those installations we provide a separate installer image, that facilitates the installation process.

Run the following command to execute the installer for Streamsheets (replace the placeholders accordingly).

* `<PATH>`: path to the installation directory, e.g., "~/streamsheets"
* `<VERSION>`: version to install, e.g., "2.0"
* `<PLATFORM>`: target platform (one of `linux`, `macos`, `rpi`, `win`)

```
docker run -v <PATH>:/streamsheets cedalo/streamsheets-installer:<VERSION>-<PLATFORM>
```

Example
```
docker run -v ~/streamsheets:/streamsheets cedalo/streamsheets-installer:2.0-linux
```

<!-- ### Running from source code

TBD -->

## 🚀 Quick start

After successfully running the installer navigate to the install directory and run the start script (depending on the target platform).

For Linux:
```
cd <PATH>
sh start.sh
```

For macOS:
```
cd <PATH>
sh start.sh
```

For Windows:
```
cd <PATH>
start.bat
```

For Raspberry Pi:
```
cd <PATH>
sh start.sh
```

## 📚 Documentation

You can find the Streamsheet documentation on the [documentation website](https://docs.cedalo.com/).

Check out the Getting Started page for a quick overview.

The documentation is divided into several sections:

* [Installation](https://docs.cedalo.com/installation.html)
* [Introduction](https://docs.cedalo.com/introduction.html)
* [Main Components](https://docs.cedalo.com/maincomponents.html)
* [Getting Started](https://docs.cedalo.com/gettingstarted.html)
* [Tutorials](https://docs.cedalo.com/tutorials.html)
* [Functions](https://docs.cedalo.com/functions.html)
* [Other](https://docs.cedalo.com/others.html)
* [Glossary](https://docs.cedalo.com/glossary.html)

## 🙋 FAQ

### Who maintains Streamsheets?

Streamsheets are maintained by the [Cedalo AG](https://cedalo.com/). Please check out our [team page](https://cedalo.com/en/aboutus/)!

### Looking for support?

For questions and support please join our [Forum](https://forum.streamsheets.com), ask a question on [Stack Overflow](https://stackoverflow.com/questions/tagged/streamsheets), or contact us on [Twitter](https://twitter.com/cedalo_com).

### Where are the docs?

Check out our documentation website: [docs.cedalo.com](https://docs.cedalo.com/).

### Want to contribute to Streamsheets?

Check out our [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

- Check out the issues with the [good first issue](https://github.com/cedalo/streamsheets/labels/good%20first%20issue) and [help wanted](https://github.com/cedalo/streamsheets/labels/help%20wanted) label.
- Also have a look at our [roadmap](notes/roadmap).

### How is the repository structured?

The Streamsheets repository is organized as a mono repository that is composed of many npm packages.

## ⭐️ Show your support

Give a ⭐️ if this project helped you!

## 📃 License

Copyright (c) 2017-2019 Cedalo AG.

Streamsheets is licensed under the Eclipse Public License - v 2.0. Please see the LICENSE file for details.
