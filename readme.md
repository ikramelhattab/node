## Getting started with node js project


**Step 0. Install mongoDB in your machine**

You can find installation instructions on the official docs [here](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/).

**Step 1. Clone the project into a fresh folder**
```
$ git clone 'https://github.com/Smart-Logger/tarsier-backend'
$ cd 'tarsier-backend'
```

**Step 2. Install dependencies**
```
$ npm install
```

**Step 3. Install external libraries**

This project rely on two external library to works properly `Ghostscript` version `9.25` and `graphicsmagick` version `1.3.35-Q16`

#### Ghostscript 9.52

- Windows: You can install Ghostscript 9.52 from [here](https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/tag/gs952).
- Centos: Coming soon.

#### graphicsmagick 1.3.35-Q16

- Windows: You can find the installer correspendent to your system in the following links [Windows 64](http://ftp.icm.edu.pl/pub/unix/graphics/GraphicsMagick/windows/GraphicsMagick-1.3.35-Q16-win64-dll.exe) and [Windows 32](http://ftp.icm.edu.pl/pub/unix/graphics/GraphicsMagick/windows/GraphicsMagick-1.3.36-Q16-win32-dll.exe).
- Centos: Coming soon.


**Step 4. Prepare Node.js environment**

Create new file named `.env` in the project root.

Copy the content from the file `.sample-env` to the new created `.env` file.

**Step 5. Run the server**
```
$ node index.js
```

