import Global = NodeJS.Global;
import MockPromise from "jest-mock-promise";

declare global {
    const fetchMock: FetchMockType;
    namespace NodeJS {
        interface Global {
            fetch: FetchMockType;
        }
    }
}

export interface GlobalWithFetchMockType extends Global {
    mockFetch: FetchMockType;
    fetch: FetchMockType;
}

export interface HttpResponse {
    data: any;
    status?: number;
    statusText?: string;
    headers?: object;
    config?: object;
}

export interface FetchMockAPI {
    /**
     * Simulate a server response, (optionally) with the given data
     * @param response (optional) response returned by the server
     * @param queueItem (optional) request promise for which response should be resolved
     * @param silentMode (optional) specifies whether the call should throw an error or
     *   only fail quietly if no matching request is found.
     */
    mockResponse: (
        response?: HttpResponse,
        queueItem?: MockPromise | FetchMockQueueItem,
        silentMode?: boolean,
    ) => void;
    /**
     * Simulate an error in server request
     * @param error (optional) error object
     * @param queueItem (optional) request promise for which response should be resolved
     * @param silentMode (optional) specifies whether the call should throw an error or
     *   only fail quietly if no matching request is found.
     */
    mockError: (
        error?: any,
        queueItem?: MockPromise | FetchMockQueueItem,
        silentMode?: boolean,
    ) => void;
    /**
     * Returns promise of the most recent request
     */
    lastPromiseGet: () => MockPromise;
    /**
     * Removes the give promise from the queue
     * @param promise
     */

    popPromise: (promise?: MockPromise) => MockPromise;
    /**
     * Returns request item of the most recent request
     */
    lastReqGet: () => FetchMockQueueItem;
    /**
     * Returns request item of the most recent request with the given url
     * The url must equal the url given in the 1st parameter when the request was made
     * Returns undefined if no matching request could be found
     *
     * The result can then be used with @see mockResponse
     *
     * @param url the url of the request to be found
     */
    getReqByUrl: (url: string) => FetchMockQueueItem;
    /**
     * Removes the give request from the queue
     * @param promise
     */
    popRequest: (promise?: FetchMockQueueItem) => FetchMockQueueItem;

    /**
     * Clears all of the queued requests
     */
    reset: () => void;
}

export interface FetchMockQueueItem {
    promise: MockPromise;
    url: string;
    data?: any;
    config?: any;
}

/**
 * `fetch` is called like a function, that's why we're defining it as a spy
 */
export type FetchMockType = FetchMockAPI & jest.Mock<MockPromise, [string, any?, any?]>;
