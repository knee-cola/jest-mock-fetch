/**
 * TypeScript version of `fetch` mock for unit testing with [Jest](https://facebook.github.io/jest/).
 *
 * @author   knee-cola <nikola.derezic@gmail.com>
 * @license  @license MIT License, http://www.opensource.org/licenses/MIT
 */

import MockPromise from 'jest-mock-promise';

import {
    FetchMockQueueItem,
    FetchMockType,
    HttpResponse,
} from "./mock-fetch-types";

/** a FIFO queue of pending request */
const _pending_requests: FetchMockQueueItem[] = [];

const _newReq: (url:string, data?: any, config?: any) => MockPromise = (url:string, data?: any, config?: any) => {

    const promise: MockPromise = new MockPromise();

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

MockFetch.popPromise = (promise?: MockPromise) => {
    if (promise) {
        // remove the promise from pending queue
        for (let ix = 0; ix < _pending_requests.length; ix++) {
            const req: FetchMockQueueItem = _pending_requests[ix];

            if (req.promise === promise) {
                _pending_requests.splice(ix, 1);
                return req.promise;
            }
        }
    } else {
        // take the oldest promise
        const req: FetchMockQueueItem = _pending_requests.shift();
        return req ? req.promise : void 0;
    }
};

MockFetch.popRequest = (request?: FetchMockQueueItem) => {
    if (request) {
        const ix = _pending_requests.indexOf(request);
        if (ix === -1) {
            return void 0;
        }

        _pending_requests.splice(ix, 1);
        return request;
    } else {
        return _pending_requests.shift();
    }
};

/**
 * Removes an item form the queue, based on it's type
 * @param queueItem
 */
const popQueueItem = (queueItem: MockPromise | FetchMockQueueItem = null) => {
    // first let's pretend the param is a queue item
    const request: FetchMockQueueItem = MockFetch.popRequest(
        queueItem as FetchMockQueueItem,
    );

    if (request) {
        // IF the request was found
        // > set the promise
        return request.promise;
    } else {
        // ELSE maybe the `queueItem` is a promise (legacy mode)
        return MockFetch.popPromise(queueItem as MockPromise);
    }
};

MockFetch.mockResponse = (
    response?: HttpResponse,
    queueItem: MockPromise | FetchMockQueueItem = null,
    silentMode: boolean = false,
): void => {
    // replacing missing data with default values
    response = Object.assign(
        {
            config: {},
            data: {},
            headers: {},
            status: 200,
            statusText: "OK",
        },
        response,
    );

    const promise = popQueueItem(queueItem);

    if (!promise && !silentMode) {
        throw new Error("No request to respond to!");
    } else if (!promise) {
        return;
    }

    // resolving the Promise with the given response data
    promise.resolve(response);
};

MockFetch.mockError = (
    error: any = {},
    queueItem: MockPromise | FetchMockQueueItem = null,
    silentMode: boolean = false,
) => {
    const promise = popQueueItem(queueItem);

    if (!promise && !silentMode) {
        throw new Error("No request to respond to!");
    } else if (!promise) {
        return;
    }

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
