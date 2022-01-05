# What's this?
This is a light-weight, easy to use synchronous `fetch` mock for unit testing with [Jest](https://facebook.github.io/jest/).

## Why should I use it?
Because it works _synchronously_, which will make your tests easier to write, read and understand. Let's take a second to understand why that is ...

### Problem with _other_ mocks
Most other `fetch` mocks work _async_, which makes writing tests a bit more difficult due to the following:
* responses need to be mocked _beforehand_ (before a call to `fetch` is made)
* assertations needs to be wrapped in a `then` handler function

Since order of execution differs from the order in which statements in a test are written, reading and understandind such tests is a bit more difficult.

### How this mock helps
This mock works _synchronously_, meaning that:
* you mock the response _after_ the `fetch` call is made (i.e. by the component beeing tested)
* assertations don't need to be wrapped inside a `then` handler function

Order of execution exactly matches the order in which statements in you test are written, which makes reading them trivial. Take a look at [basic example](#basic-example) bellow.

# What's in this document?
* [Installation](#installation)
  * [Regular setup](#regular-setup)
  * [Setup for polyfill/ponyfill libraries](#setup-for-polyfillponyfill-libraries)
* [Basic example](#basic-example)
* [fetch mock API](#fetch-mock-api)
  * [fetch.mockResponse](#fetchmockresponseresponse-requestinfo)
  * [fetch.mockError](#fetchmockerrorerr-requestinfo)
  * [fetch.lastReqGet](#fetchlastreqget)
  * [fetch.lastPromiseGet](#fetchlastpromiseget)
  * [fetch.reset](#fetchreset)
* [Additional examples](#additional-examples)
  * [Values returned by `lastReqGet` and `lastPromiseGet` methods](#values-returned-by-lastreqget-and-lastpromiseget-methods)
  * [Resolving requests out of order](#resolving-requests-out-of-order)
* [Synchronous promise](#synchronous-promise)

# Installation
Installation is simple - just run:

    npm i --save-dev jest-mock-fetch

## Regular setup
Create a `setupJest.js` file to setup the mock with the folloging content:
```javascript
// setupJest.js
global.fetch = require('jest-mock-fetch');
```

Edit the `jest.config.js` file and add the following:
```javascript
"jest": {
  "automock": false,
  "setupFiles": [
    "./setupJest.js"
  ]
}
```

## Setup for polyfill/ponyfill libraries
If you are using a polyfill/ponyfill library (i.e. [unfetch](https://www.npmjs.com/package/unfetch)) which implement `fetch` API then you need to use a different setup procedure.

Here's an example for [unfetch](https://www.npmjs.com/package/unfetch):

* We need to setup a [manual Jest mock](https://facebook.github.io/jest/docs/en/manual-mocks.html)
  * create `__mocks__` directory in your project root
  * inside this new directory create a files named `unfetch.js`
  * copy & past the following snippets to `unfetch.js` file
    ```javascript
    // ./__mocks__/unfetch.js
    import unfetch from 'jest-mock-fetch';
    export default unfetch;
    ```

# Basic example
Let's consider that we want to test a component which uses `fetch`. This component returns a promise, which will be resolved after `fetch` is done communicating with the server.

Here's a Jest snippet, which explains how we would test this component:
```javascript
// ./test/UppercaseProxy.spec.js
import UppercaseProxy from '../src/UppercaseProxy';

afterEach(() => {
    // cleaning up the mess left behind the previous test
    fetch.reset();
});

it('UppercaseProxy should get data from the server and convert it to UPPERCASE', () => {

    let catchFn = jest.fn(),
        thenFn = jest.fn();

    // using the component, which should make a server response
    let clientMessage = 'client is saying hello!';

    UppercaseProxy(clientMessage)
        .then(thenFn)
        .catch(catchFn);

    // since `fetch` is a spy, we can check if the server request was correct
    // a) request went to the correct web service URL ('/web-service-url/')
    // b) if the payload was correct ('client is saying hello!')
    expect(fetch).toHaveBeenCalledWith('/web-service-url/', {data: clientMessage });

    // simulating a server response
    fetch.mockResponse({ text: () => 'server says hello!' });

    // checking the `then` spy has been called and if the
    // response from the server was converted to upper case
    expect(thenFn).toHaveBeenCalledWith('SERVER SAYS HELLO!');

    // catch should not have been called
    expect(catchFn).not.toHaveBeenCalled();
});
```

To make this example complete and easier to understand, let's have a look at a (verbose) implementation of component we are testing:
```javascript
// ./src/UppercaseProxy.js
const UppercaseProxy = (clientMessage) => {
    return(
        // requesting data from server
        fetch('/web-service-url/', { body: clientMessage })
            // get the response text
            .then(response => response.text())
            // convert text to uppercase
            .then(text => text.toUpperCase())
    );
};

export default UppercaseProxy;
```

At the bottom of this page you can find [additional examples](#additional-examples).

# `fetch` mock API
In addition to mock `fetch` itself being a spy, it also has additional public methods, which are intended to facilitate mocking:
* `mockResponse` - simulates a server (web service) response
* `mockError` - simulates a (network/server) error 
* `lastReqGet` - returns extended info about the most recent request
* `lastPromiseGet` - returns promise created when the most recent request was made
* `reset` - resets the `fetch` mock object - prepare it for the next test (typically used in `afterEach`)

## fetch.mockResponse(response[, item])
After a request has been made to the server (web service), this method resolves that request by simulating a server response. Status meaning is ignored, i.e. `400` will still resolve `fetch` promise. Use `mockError` for non-2xx responses.

**NOTE:** This method should be called _after_ the fetch call in your test for the promise to resolve properly. After all remember that this mock works **synchronously**.

### Arguments: `response`
The first argument of this method is the a **response object** returned by the server, with a structure illustrated by the snippet below. All the properties are optional, meaning that if a property is ommitted it will be replaced by a default value (defaults are shown in the snippet).
```javascript
response = {
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
}
```
The given response object will get passed to `then` even handler function.

### Arguments: (optional) `item`
The second argument enables us to pinpoint an exact server request we wish to resolve. This can be useful if we're making multiple server requests and are planing to resolve them in a different order from the one in which they were made.

We can supply two different objects:
* an extended request info object, which can be accessed by calling `lastReqGet` method
* a `promise` object, which is can be accessed by calling the `lastPromiseGet` method

If ommited this argument defaults to the latest request made (internally the `lastReqGet` method is called).

At the end of this document you can find [an example](#resolving-requests-out-of-order) which demonstrates how this parameter can be used.

### Arguments: (optional) `silentMode`
Both `mockResponse` and `mockError` will throw an error if there's no pending request to resolve/reject.
You can change this behavior by passing `true` as third argument, activating the so-called `silentMode`. With `silentMode` activated, the methods will just do nothing.

## fetch.mockError(err[, item])
This method simulates an error while making a server request (network error, server error, etc ...). 

**NOTE:** This method should be called _after_ the fetch call in your test for the promise to resolve properly. After all remember that this mock works **synchronously**.

### Arguments: `err`
Error object will get passed to `catch` event handler function. If omitted it defaults to an empty object.

### Arguments: (optional) `item`
The second argument is a `item` object, which works the same way as described part about the `mockResponse` method.

### Arguments: (optional) `silentMode`
The third argument is the `silentMode` flag, which works the same way as described part about the `mockResponse` method.

## fetch.lastReqGet()
`lastReqGet` method returns extended info about the most recent request. The returned value can be used to pinpoint exact server request we wish to resolve (the value is passed as the second param of `mockResponse` or `mockError` methods).

The returned info contains all the data relevant to the request. It has the following structure (an example):
```javascript

let requestInfo = {
    // promise created while
    promise: SimplePromise,
    // URL passed to the fetch
    url: "https://github.com/",
    // data which was passed
    data: { text: "this is payload sent to the server" },
    // config which was passed
    config: {
        ... something ...
    }
}
```

[Additional examples](#additional-examples) at the end of this document illustrate how this method can be used.

**NOTE:** this is a sibling method to the `lastPromiseGet` (which returns only the promise portion of this the request object).

## fetch.getReqByUrl(url)

`getReqByUrl()` returns the same info about a specific request as `lastReqGet` (see above). Instead of returning the
most recent request, it returns the most recent request matching the given url.

### Arguments: `url`
The url to be matched. Must match exactly the url passed to fetch before.

## fetch.lastPromiseGet()
`lastPromiseGet` method returns a promise given when the most recent server request was made. The returned value can be used to pinpoint exact server request we wish to resolve (the value is passed as the second param of `mockResponse` or `mockError` methods).

[Additional examples](#additional-examples) at the end of this document illustrate how this method can be used.

**NOTE:** This is a sibling method to the `lastReqGet`, which in addition to promise returns object containing extended info about the request.

## fetch.reset()
`reset` method clears state of the `fetch` mock to initial values. It should be called after each test, so that we can start fresh with our next test (i.e. from `afterEach` method).

# Additional examples
Since fetchMock is relatively simple, most of its functionality was covered in [basic example](#basic-example) at the beginning of this document. In this section we'll explore features not covered by that initial example.

## Values returned by `lastReqGet` and `lastPromiseGet` methods

The following example illustrates the meaning of the values returned by `lastReqGet` and `lastPromiseGet` methods.

The first snippet shows a component which will be tested. The component makes a request to the server and stores the promise returned by `fetch`.

```javascript
// ./src/MyComponent.js
class MyComponent {

    CallServer () {
        // making a request and storing the given promise
        this.fetchPromise = fetch('/web-service-url/', { data: clientMessage });
    }
}

export default MyComponent;
```
In our spec file we will compare promise stored inside the `MyComponent` with values returned by `lastReqGet` and `lastPromiseGet` methods:

```javascript
// ./test/MyComponent.spec.js
    import MyComponent from '../src/SomeSourceFile';

    let myComp = new MyComponent();
    
    myComp.CallServer();

    // getting the extended info about the most recent request
    let lastReqInfo = fetch.lastReqGet();
    // getting the promise made when the most recent request was made
    let lastPromise = fetch.lastPromiseGet();
    
    // the following expression will write `true` to the console
    // > here we compare promise stored in the `MyComponent` to the one
    //   returned by the `lastPromiseGet` method
    console.log(myComp.fetchPromise === lastPromise);

    // the following expression will also write `true` to the console
    // > here we compare promise stored in the `MyComponent`
    //   to the one in the request info, which was returned by the
    //   `lastReqGet` method
    console.log(myComp.fetchPromise === lastReqInfo.promise);

    // the following will also write "true" to console,
    // since it't the same object
    console.log(lastPromise ===  lastReqInfo.promise);
```

## Resolving requests out of order
In the following example we'll have a look at how to resolve requests at desired order by using [`lastReqGet`](#fetchlastreqget) method.

In this example we'll create two consecutive requests before simulating a server response to the first one.

```javascript
it('when resolving a request an appropriate handler should be called', () => {

    let thenFn1 = jest.fn(),
        thenFn2 = jest.fn();
    
    // creating the FIRST server request
    UppercaseProxy('client is saying hello!').then(thenFn1);
    // storing the request info - we'll need it later to pinpoint the request
    let firstRequestInfo = fetch.lastReqGet();

    // creating the SECOND server request
    // BEFORE the first had chance to be resolved
    UppercaseProxy('client says bye bye!').then(thenFn2);

    // Simulating a server response to the FIRST request
    // -> we're using request info object to pinpoint the request
    // ... IF the info object is ommited, the method would automatically
    // resolve to the newest request from the internal queue (the SECOND one)
    const firstResponse = fetch.mockResponse({ text: () => 'server says hello!' }, firstRequestInfo);

    // only the first handler should have been called
    expect(thenFn1).toHaveBeenCalled();
    expect(thenFn2).not.toHaveBeenCalled();

    // Simulating a server response to the SECOND request
    // NOTE: here we don't need to provide the request info,
    // since there is only one unresolved request left
    // -> `mockResponse` resolves the last request in the
    //     queue if request info is ommited
    fetch.mockResponse({ data: 'server says bye bye!' });

    // the first `then` handles should be called only once
    expect(thenFn1).toHaveBeenCalledTimes(1);
    // now the second `then` handler should be called
    expect(thenFn2).toHaveBeenCalled();
});
```
Although this might not be the most realistic use-case of this functionality, it does illustrate how `lastReqGet` method can be used to alter the default behaviour of the `mockResponse` method.

**NOTE:** the identical effect can be achieved by using the [`lastPromiseGet`](#fetchlastpromiseget) method. These two methods perform a similar task, as described in the corresponding documentation.

# Synchronous promise
The magic which enables fetch mock to work synchronously is hidden away in [`jest-mock-promise`](https://www.npmjs.com/package/jest-mock-promise), which enables promises to be settled in synchronous manner.

# Inspiration
This mock is based on: [jest-mock-axios](https://github.com/knee-cola/jest-mock-axios)

# License
MIT License, [http://www.opensource.org/licenses/MIT](http://www.opensource.org/licenses/MIT)
