
# Overview

All functions are asynchronous. They may require several arguments. The latest argument is always callback `function(err, result)`, and it is optional.

All functions return a Promise, which is inherited from `this`. Which means:

 - you can chain several pm2 methods together
 - you can use return value as a promise

## Full-featured example

Here is your normal node.js-style api. Note that `this` in callbacks refers to pm2 object, so you can use it easily:

```js
require('pm2')()
  .version(function(err, ver) {
    console.log('Welcome to PM2, version is:', ver)

    console.log('Now, lets start a process...')
    this.create('/tmp/test.js', function(err, res) {
      console.log("It is started, process ids are:", Object.keys(res))

      console.log('Getting a list of available processes...')
      this.list(function(err, list) {
        Object.keys(list).forEach(function(k) {
          var p = list[k]
          console.log('Process %s, pid %s, name %s', p.pm_id, p.pid, p.name)
        })

        console.log("That's all for now. Goodbye!")
      })
    })
  })
```

If you like promises too much, here is what you can do instead:

```js
require('pm2')()
  .then(function() {
    return this.version()
  })
  .then(function(ver) {
    console.log('Welcome to PM2, version is:', ver)

    console.log('Now, lets start a process...')
    return this.create('/tmp/test.js')
  })
  .then(function(res) {
    console.log("It is started, process ids are:", Object.keys(res))

    console.log('Getting a list of available processes...')
    return this.list()
  })
  .then(function(list) {
    Object.keys(list).forEach(function(k) {
      var p = list[k]
      console.log('Process %s, pid %s, name %s', p.pm_id, p.pid, p.name)
    })

    console.log("That's all for now. Goodbye!")
  })
```

## API reference

### disconnect([cb])

Disconnect from pm2 daemon. You need to execute this function iff you manually connected to pm2 using `connect()` function before.

Example:

```js
// simple app that connects, retrieves pm2 version and disconnects
require('pm2')()
  .then(function() { return this.connect() })
  .then(function() { return this.version() })
  .then(function() { return this.disconnect() })
```

### connect([cb])

Connect to pm2 daemon. If you didn't call this function manually, it'll be called automatically each time you execute one of the other functions.

It is useful if you want to maintain continuous connection to pm2.

Example:

```js
// this app won't exit, because it maintains connection with pm2
require('pm2')().connect()
```

### create(app[, cb)

Create a new app in the pm2 database and immediately start it.

`app` could be either a string (path to pm2 application) or an object (see [JSON app declaration](https://github.com/Unitech/PM2/blob/development/ADVANCED_README.md#a10) for details).

If succeeded, this function returns an array of created processes.

Example:

```js
require('pm2')().create({
  script: '/tmp/hello.js',
  instances: 'max',
}, function(err, started) {
  console.log('Successfully started %s processes', started.length)
})
// Output:
//   Successfully started 4 processes
```

### list([cb])

Return the list of all running processes.

### version([cb])

Retrieves pm2 version of the currently running daemon.

Example:

```js
require('pm2')().version(function(err, ver) {
  console.log("You're running pm2 version", ver)
})
// output: You're running pm2 version 0.11.0-beta1
```

## Events

PM2 instance is an EventEmitter, you can listen on the following events:

 - `connect` event fired each time it connects to pm2
 - `disconnect` event fired each time it disconnects from pm2

### Example

```js
require('pm2')()
  .on('connect', function() {
    console.log('Connected to PM2.')
  })
  .on('disconnect', function() {
    console.log('Disconnected from PM2.')
  })
  .version(function(err, ver) {
    console.log("Version", ver)
  })

// Output:
//   Connected to PM2.
//   Version 0.11.0-beta1
//   Disconnected from PM2.
```

