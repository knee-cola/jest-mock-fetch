/**
 * TypeScript version of `fetch` mock for unit testing with [Jest](https://facebook.github.io/jest/).
 *
 * @author   knee-cola <nikola.derezic@gmail.com>
 * @license  @license MIT License, http://www.opensource.org/licenses/MIT
 */

import JestMockPromise from "jest-mock-promise";
const { PassThrough } = require('stream');

import {
    FetchMockQueueItem,
    FetchMockType,
    HttpResponse,
    HttpResponsePartial,
} from "./mock-fetch-types";

/** a FIFO queue of pending request */
const _pending_requests: FetchMockQueueItem[] = [];

const _newReq: (url: string, data?: any, config?: any) => JestMockPromise = (url: string, data?: any, config?: any) => {

    const promise: JestMockPromise = new JestMockPromise();

    _pending_requests.push({
        config,
        data,
        promise,
        url,
    });

    return promise;
};

/** `fetch` is called like a function, that's why we're defining it as a spy */
const MockFetch: FetchMockType = (jest.fn(_newReq) as unknown) as FetchMockType;

/**
 * (LEGACY) Removes the give promise from the queue OR last promise if none was suppiled
 * @param promise
 */
MockFetch.popPromise = (promise?: JestMockPromise):JestMockPromise | undefined => {
    console.warn("MockFetch.popPromise is a legacy method - please use `MockFetch.popQueueItem` instead");
    const queueItem = MockFetch.popQueueItem(promise);
    return(queueItem?.promise);
}

/**
 * (LEGACY) Removes the give request from the queue OR last item if none was suppiled
 * @param item
 */
MockFetch.popRequest = (item?: FetchMockQueueItem):FetchMockQueueItem | undefined => {
    console.warn("MockFetch.popRequest is a legacy method - please use `MockFetch.popQueueItem` instead");
    const queueItem = MockFetch.popQueueItem(item);
    return(queueItem);
};

/**
 * Removes an item form the queue
 * @param requestOrPromise (optional) which queue item to remove (can be specified by given promise)
 */
 MockFetch.popQueueItem = (requestOrPromise?: FetchMockQueueItem | JestMockPromise): FetchMockQueueItem | undefined => {
    if (requestOrPromise) {

        let ix = _pending_requests.indexOf(requestOrPromise as FetchMockQueueItem);

        // IF request is not found
        // > try searching for element by promise
        if (ix === -1) {
            ix = _pending_requests.findIndex(({promise}) => promise === requestOrPromise as JestMockPromise);
        }

        if(ix === -1) {
            return;                
        }

        return(_pending_requests.splice(ix, 1)[0]);

    } else {

        // return the last element
        return _pending_requests.shift();
    }
};

/**
 * Simulate a server response, (optionally) with the given data
 * @param responseObject (optional) response returned by the server
 * @param queueItem (optional) request promise for which response should be resolved
 * @param silentMode (optional) specifies whether the call should throw an error or
 *   only fail quietly if no matching request is found.
 */
    MockFetch.mockResponse = (
    responseObject?: HttpResponsePartial,
    item?: FetchMockQueueItem | JestMockPromise,
    silentMode: boolean = false,
): HttpResponse | undefined => {

    const request = MockFetch.popQueueItem(item);

    if (!request && !silentMode) {
        throw new Error("No request to respond to!");
    } else if (!request) {
        return;
    }

    const { promise, url } = request as FetchMockQueueItem;

    const responseDefaults:HttpResponse = {
        body: new PassThrough(),
        headers: new Headers(),
        status: 200,
        statusText: "OK",
        ok: true,
        url,
        arrayBuffer: () => new ArrayBuffer(0),
        blob: () => new Blob(),
        clone: jest.fn(),
        error: jest.fn(),
        formData: () => new FormData(),
        json: () => ({ }),
        redirect: jest.fn(),
        text: () => "dummy text"
    };

    const actualResponse:HttpResponse = {
        ...responseDefaults,
        // all params can be overriden via the `responseObject` param
        ...responseObject
    }

    promise.resolve(actualResponse);

    return(actualResponse);
};

MockFetch.mockError = (
    error: any = {},
    item?: FetchMockQueueItem | JestMockPromise,
    silentMode: boolean = false,
) => {

    const request = MockFetch.popQueueItem(item);

    if (!request && !silentMode) {
        throw new Error("No request to respond to!");
    } else if (!request) {
        return;
    }

    const { promise } = request;

    // resolving the Promise with the given response data
    promise.reject(error);
};

MockFetch.lastReqGet = () => {
    return _pending_requests[_pending_requests.length - 1];
};

MockFetch.lastPromiseGet = () => {
    const req = MockFetch.lastReqGet();
    return req ? req.promise : void 0;
};

MockFetch.getReqByUrl = (url: string) => {
    return _pending_requests
        .slice()
        .reverse() // reverse cloned array to return most recent req
        .find((x: FetchMockQueueItem) => x.url === url);
};

MockFetch.reset = () => {
    // remove all the requests
    _pending_requests.splice(0, _pending_requests.length);
};

// this is a singleton object
export default MockFetch;
