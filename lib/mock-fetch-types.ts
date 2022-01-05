import JestMockPromise from "jest-mock-promise";

declare global {
    const fetchMock: FetchMockType;
    namespace NodeJS {
        interface Global {
            fetch: FetchMockType;
        }
    }
}

export interface GlobalWithMockFetch extends NodeJS.Global {
    mockFetch: FetchMockType;
    fetch: FetchMockType;
}

export type HttpResponse = {
    /** A ReadableStream of the body contents. */
    body: ReadableStream;
    /** The status code of the response. (This will be 200 for a success). */
    status: number;
    /** The status message corresponding to the status code. (e.g., OK for 200). */
    statusText: string;
    /** The Headers object associated with the response. */
    headers: Headers;
    /** A boolean indicating whether the response was successful (status in the range 200–299) or not. */
    ok:boolean;
    /** The URL of the response */
    url:string;
    /** Returns a promise that resolves with an ArrayBuffer representation of the response body. */
    arrayBuffer: () => ArrayBuffer;
    /** Returns a promise that resolves with a Blob representation of the response body. */
    blob: () => Blob;
    /** Creates a clone of a Response object. */
    clone: jest.Mock<any, any>;
    /** Returns a new Response object associated with a network error. */
    error: jest.Mock<any, []>;
    /** Returns a promise that resolves with a FormData representation of the response body. */
    formData: () => FormData;
    /** Returns a promise that resolves with the result of parsing the response body text as JSON. */
    json: () => object;
    /** Creates a new response with a different URL. */
    redirect: jest.Mock<any, []>;
    /** Returns a promise that resolves with a text representation of the response body. */
    text: () => string;
}

/** HTTP Request kod kojeg su svi paramsi opctionalni */
export type HttpResponsePartial = {
    [Property in keyof HttpResponse]?: HttpResponse[Property];
};

export interface FetchMockAPI {
    /**
     * Simulate a server response, (optionally) with the given data
     * @param responseParams (optional) response returned by the server
     * @param queueItem (optional) request promise for which response should be resolved
     * @param silentMode (optional) specifies whether the call should throw an error or
     *   only fail quietly if no matching request is found.
     */
    mockResponse: (
        responseObject?: HttpResponsePartial,
        queueItem?: FetchMockQueueItem | JestMockPromise,
        silentMode?: boolean,
    ) => HttpResponse | undefined;
    /**
     * Simulate an error in server request
     * @param error (optional) error object
     * @param queueItem (optional) request promise for which response should be resolved
     * @param silentMode (optional) specifies whether the call should throw an error or
     *   only fail quietly if no matching request is found.
     */
    mockError: (
        error?: any,
        queueItem?: FetchMockQueueItem | JestMockPromise,
        silentMode?: boolean,
    ) => void;
    /**
     * Returns promise of the most recent request
     */
    lastPromiseGet: () => JestMockPromise | undefined;

    /**
     * (LEGACY) Removes the give promise from the queue OR last promise if none was suppiled
     * @param promise
     */
    popPromise: (promise?: JestMockPromise) => JestMockPromise | undefined;

    /**
     * (LEGACY) Removes the give promise from the queue OR last promise if none was suppiled
     * @param promise
     */
    popRequest: (promise?: FetchMockQueueItem) => FetchMockQueueItem | undefined;

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
    getReqByUrl: (url: string) => FetchMockQueueItem | undefined;
    /**
     * Removes the give request from the queue
     * @param promise
     */
     popQueueItem: (promiseOrRequets?: FetchMockQueueItem | JestMockPromise) => FetchMockQueueItem | undefined;

    /**
     * Clears all of the queued requests
     */
    reset: () => void;
}

export interface FetchMockQueueItem {
    promise: JestMockPromise;
    resource: RequestInfo;
    init?: RequestInit;
}

/**
 * `fetch` is called like a function, that's why we're defining it as a spy
 */
export type FetchMockType = FetchMockAPI & jest.Mock<JestMockPromise, [string, any?, any?]>;
