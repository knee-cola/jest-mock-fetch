import JestMockPromise from 'jest-mock-promise';
import fetch from "../lib/mock-fetch";
import { HttpResponse, HttpResponsePartial } from '../lib/mock-fetch-types';

const URL = 'mock URL';

describe("MockFetch", () => {
    afterEach(() => {
       fetch.reset();
    });

    it(`should return a promise when called`, () => {
        expect(typeof fetch).toBe("function");
        expect(fetch(URL)).toBeInstanceOf(JestMockPromise);
    });

    describe("mockResponse", () => {
        it("`mockResponse` should resolve the given promise with the provided response", () => {
            const thenFn = jest.fn();
            const promise = fetch(URL);
                  promise.then(thenFn);

            const responseObject = fetch.mockResponse({
                status: 404,
                statusText: "Not-Found",
            }, promise) as HttpResponse;

            expect(thenFn).toHaveBeenCalledWith(responseObject);
        });

        it("`mockResponse` should resolve the provided request", () => {
            const firstFn = jest.fn();
            const secondFn = jest.fn();
            const thirdFn = jest.fn();

            fetch(URL).then(firstFn);
            
            fetch(URL).then(secondFn);
            const secondRequest = fetch.lastReqGet();
            
            fetch(URL).then(thirdFn);

            const expectedResponse = fetch.mockResponse({
                status: 404,
                statusText: "NotFound",
            }, secondRequest) as HttpResponse;

            expect(firstFn).not.toHaveBeenCalled();
            expect(secondFn).toHaveBeenCalledWith(expectedResponse);
            expect(thirdFn).not.toHaveBeenCalled();
        });

        it("`mockResponse` should resolve the last given item if none was provided", () => {

            const firstThen = jest.fn();
            const secondThen = jest.fn();
            const thirdThen = jest.fn();

            fetch(URL).then(firstThen);
            fetch(URL).then(secondThen);
            fetch(URL).then(thirdThen);

            fetch.mockResponse();

            expect(firstThen).toHaveBeenCalled();
            expect(secondThen).not.toHaveBeenCalled();
            expect(thirdThen).not.toHaveBeenCalled();

            fetch.mockResponse();

            expect(secondThen).toHaveBeenCalled();
            expect(thirdThen).not.toHaveBeenCalled();

            fetch.mockResponse();

            expect(thirdThen).toHaveBeenCalled();

            // functions should be called once only
            expect(firstThen.mock.calls.length).toBe(1);
            expect(secondThen.mock.calls.length).toBe(1);
            expect(thirdThen.mock.calls.length).toBe(1);
        });

        it("`mockResponse` should remove the LAST request from the queue", () => {
            fetch(URL);
            fetch.mockResponse();
            expect(fetch.popQueueItem()).toBeUndefined();
        });

        it("`mockResponse` should throw a specific error if there's no active request", () => {
            expect(() => fetch.mockResponse()).toThrowError(
                "No request to respond to!",
            );
        });

        it("`mockResponse` should not throw a specific error if silentMode is true", () => {
            expect(() =>
                fetch.mockResponse(undefined, undefined, true),
            ).not.toThrow();
        });

        it("`mockResponse` should work when used with async / await", async () => {
            const thenFn = jest.fn();
            const promise = fetch(URL)
                .then(thenFn);

            fetch.mockResponse();

            await promise;
            expect(thenFn).toHaveBeenCalled();
        });

        it("mockResponse should support text() method", async () => {
            const thenFn = jest.fn();
            const responseText = "response text";

            fetch(URL)
                .then(({text}) => text())
                .then(thenFn);

            fetch.mockResponse({
                text: () => responseText
            });

            expect(thenFn).toHaveBeenCalledWith(responseText);
        });

        it("mockResponse should support json() method", async () => {
            const thenFn = jest.fn();
            const responseObject = { a: "this is prop A"};

            fetch(URL)
                .then(({json}) => json())
                .then(thenFn);

            fetch.mockResponse({
                json: () => (responseObject)
            });

            expect(thenFn).toHaveBeenCalledWith(responseObject);
        });
    });

    describe("mockError", () => {

        // mockError - Simulate an error in server request
        it("`mockError` should fail the given request with the provided response", () => {
            const thenFn = jest.fn();
            const catchFn = jest.fn();

            fetch(URL)
                .then(thenFn)
                .catch(catchFn);
            
            let lastReq = fetch.lastReqGet()

            const errorObj = { n: "this is an error" };

            fetch.mockError(errorObj, lastReq);

            expect(thenFn).not.toHaveBeenCalled();
            expect(catchFn).toHaveBeenCalledWith(errorObj);
        });

        it("`mockError` should remove the item from the queue", () => {
            fetch(URL);
            fetch.mockError();
            expect(fetch.popQueueItem()).toBeUndefined();
        });

        it("`mockError` fail the provided promise", () => {
            const firstFn = jest.fn();
            const secondFn = jest.fn();
            const thirdFn = jest.fn();

            fetch(URL).catch(firstFn);

            const secondPromise = fetch(URL);
                  secondPromise.catch(secondFn);

            fetch(URL).catch(thirdFn);

            fetch.mockError({}, secondPromise);

            expect(firstFn).not.toHaveBeenCalled();
            expect(secondFn).toHaveBeenCalled();
            expect(thirdFn).not.toHaveBeenCalled();
        });

        it("`mockError` should fail the last given request if none was provided", () => {
            const firstFn = jest.fn();
            const secondFn = jest.fn();
            const thirdFn = jest.fn();

            fetch(URL).catch(firstFn);
            fetch(URL).catch(secondFn);
            fetch(URL).catch(thirdFn);

            fetch.mockError({});

            expect(firstFn).toHaveBeenCalled();
            expect(secondFn).not.toHaveBeenCalled();
            expect(thirdFn).not.toHaveBeenCalled();

            fetch.mockError();

            expect(secondFn).toHaveBeenCalled();
            expect(thirdFn).not.toHaveBeenCalled();

            fetch.mockError();

            expect(thirdFn).toHaveBeenCalled();

            // functions should be called once only
            expect(firstFn.mock.calls.length).toBe(1);
            expect(secondFn.mock.calls.length).toBe(1);
            expect(thirdFn.mock.calls.length).toBe(1);
        });

        it("`mockError` should throw a specific error no request if found to be rejected", () => {
            expect(() => fetch.mockError()).toThrowError(
                "No request to respond to!",
            );
        });

        it("`mockError` should NOT throw a specific error if no request can be resolved but silentMode is true", () => {
            expect(() =>
                fetch.mockError(undefined, undefined, true),
            ).not.toThrow();
        });

        it("`mockError` should pass down the error object", () => {
            class CustomError extends Error {};
            const catchFn = jest.fn();

            fetch(URL).catch(catchFn);

            fetch.mockError(new CustomError("custom error"));

            expect(catchFn).toHaveBeenCalled();
            expect(catchFn.mock.calls[0][0]).toBeInstanceOf(CustomError);
        });
    });

    it("`lastReqGet` should return the most recent promise", () => {
        
        fetch(URL);
        const lastPromise = fetch(URL);

        expect(fetch.lastReqGet().promise).toBe(lastPromise);
    });

    it("`lastReqGet` should contain `init` as passed to `fetch`", () => {
        const init:RequestInit = { body: "data", method: "POST" };
        const promise = fetch(URL, init);
        const lastReq = fetch.lastReqGet();

        expect(lastReq).toEqual({
            init,
            promise,
            resource: URL,
        });
    });

    it("`lastPromiseGet` should return the most recent promise", () => {
        fetch(URL);
        const lastPromise = fetch(URL);

        expect(fetch.lastPromiseGet()).toBe(lastPromise);
    });

    it("`getReqByUrl should return the most recent request matching the url", () => {
        fetch("URL A");
        const lastPromise = fetch("URL B");

        expect(fetch.getReqByUrl("URL B")?.promise).toBe(lastPromise);
    });

    it("`getReqByUrl should return `undefined` if no matching request can be found", () => {
        fetch(URL);
        expect(fetch.getReqByUrl('non-existing URL')).toBeUndefined();
    });

    it("(LEGACY) `popPromise` should remove the given promise from the queue", () => {
        const firstPromise = fetch(URL);
        const secondPromise = fetch(URL);
        const thirdPromise = fetch(URL);

        expect(fetch.popPromise(firstPromise)).toBe(firstPromise);
        expect(fetch.popPromise(thirdPromise)).toBe(thirdPromise);
        expect(fetch.popPromise(secondPromise)).toBe(secondPromise);
        
        // queue should be empty
        expect(fetch.lastPromiseGet()).toBeUndefined();
    });

    it("(LEGACY) `popRequest` should remove the given request from the queue if request item is provided", () => {
        fetch(URL);
        const firstReq = fetch.lastReqGet();
        fetch(URL);
        const secondReq = fetch.lastReqGet();
        fetch(URL);
        const thirdReq = fetch.lastReqGet();

        expect(fetch.popRequest(firstReq)).toBe(firstReq);
        expect(fetch.popRequest(thirdReq)).toBe(thirdReq);
        expect(fetch.popRequest(secondReq)).toBe(secondReq);

        // queue should be empty
        expect(fetch.lastReqGet()).toBeUndefined();
    });

    it("`popQueueItem` should remove the given request from the queue", () => {
        fetch(URL);
        const firstReq = fetch.lastReqGet();
        fetch(URL);
        const secondReq = fetch.lastReqGet();
        fetch(URL);
        const thirdReq = fetch.lastReqGet();

        expect(fetch.popQueueItem(firstReq)).toBe(firstReq);
        expect(fetch.popQueueItem(thirdReq)).toBe(thirdReq);
        expect(fetch.popQueueItem(secondReq)).toBe(secondReq);

        // queue should be empty
        expect(fetch.lastReqGet()).toBeUndefined();
    });

    it("`reset` should clear all the queued requests", () => {
        fetch(URL);
        fetch(URL);

        fetch.reset();

        expect(fetch.lastReqGet()).toBeUndefined();
    });
});
