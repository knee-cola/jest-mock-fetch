import JestMockPromise from 'jest-mock-promise';
import fetch from "../lib/index";

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
        // mockResponse - Simulate a server response, (optionally) with the given data
        it("`mockResponse` should resolve the given promise with the provided response", () => {
            const thenFn = jest.fn();
            fetch(URL).then(thenFn);

            const responseData = { data: { text: "some data" } };

            const responseObj = {
                config: {},
                data: responseData.data,
                headers: {},
                status: 200,
                statusText: "OK",
            };

            fetch.mockResponse(responseObj);

            expect(thenFn).toHaveBeenCalledWith(responseObj);
        });

        it("`mockResponse` should remove the last promise from the queue", () => {
            fetch(URL);
            fetch.mockResponse();
            expect(fetch.popPromise()).toBeUndefined();
        });

        it("`mockResponse` should resolve the provided promise", () => {
            const firstFn = jest.fn();
            const secondFn = jest.fn();
            const thirdFn = jest.fn();

            fetch(URL).then(firstFn);

            const secondPromise = fetch(URL);

            secondPromise.then(secondFn);

            fetch(URL).then(thirdFn);

            const responseData = { data: { text: "some data" } };
            const responseObj = {
                config: {},
                data: responseData.data,
                headers: {},
                status: 200,
                statusText: "OK",
            };

            fetch.mockResponse(responseObj, secondPromise);

            expect(firstFn).not.toHaveBeenCalled();
            expect(secondFn).toHaveBeenCalledWith(responseObj);
            expect(thirdFn).not.toHaveBeenCalled();
        });

        it("`mockResponse` should resolve the last given promise if none was provided", () => {
            const firstPromise = fetch(URL);
            const secondPromise = fetch(URL);
            const thirdPromise = fetch(URL);

            const firstThen = jest.fn();
            const secondThen = jest.fn();
            const thirdThen = jest.fn();

            firstPromise.then(firstThen);
            secondPromise.then(secondThen);
            thirdPromise.then(thirdThen);

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

        it("`mockResponse` should throw a specific error if no request can be resolved", () => {
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
            const promise = fetch(URL).then(thenFn);

            const responseData = { data: { text: "some data" } };
            fetch.mockResponse(responseData);

            await promise;
            expect(thenFn).toHaveBeenCalled();
        });
    });

    describe("mockError", () => {
        // mockError - Simulate an error in server request
        it("`mockError` should fail the given promise with the provided response", () => {
            const thenFn = jest.fn();
            const catchFn = jest.fn();
            const promise = fetch(URL);
            promise.then(thenFn).catch(catchFn);

            const errorObj = { n: "this is an error" };

            fetch.mockError(errorObj, promise);
            expect(catchFn).toHaveBeenCalledWith(errorObj);
            expect(thenFn).not.toHaveBeenCalledWith(errorObj);
        });

        it("`mockError` should remove the promise from the queue", () => {
            fetch(URL);
            fetch.mockError();
            expect(fetch.popPromise()).toBeUndefined();
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

        it("`mockError` should fail the last given promise if none was provided", () => {
            const firstPromise = fetch(URL);
            const secondPromise = fetch(URL);
            const thirdPromise = fetch(URL);

            const firstFn = jest.fn();
            const secondFn = jest.fn();
            const thirdFn = jest.fn();

            firstPromise.catch(firstFn);
            secondPromise.catch(secondFn);
            thirdPromise.catch(thirdFn);

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

        it("`mockError` should throw a specific error if no request can be resolved", () => {
            expect(() => fetch.mockError()).toThrowError(
                "No request to respond to!",
            );
        });

        it("`mockError` should not throw a specific error if no request can be resolved but silentMode is true", () => {
            expect(() =>
                fetch.mockError(undefined, undefined, true),
            ).not.toThrow();
        });

        it("`mockError` should pass down the error object", () => {
            class CustomError extends Error {}
            const promise = fetch(URL);
            const catchFn = jest.fn();
            promise.catch(catchFn);

            fetch.mockError(new CustomError("custom error"));

            expect(catchFn).toHaveBeenCalled();
            expect(catchFn.mock.calls[0][0]).toBeInstanceOf(CustomError);
        });
    });

    // lastReqGet - returns the most recent request
    it("`lastReqGet` should return the most recent request", () => {
        fetch(URL);
        const lastPromise = fetch(URL);

        expect(fetch.lastReqGet().promise).toBe(lastPromise);
    });

    it("`lastReqGet` should contain config as passed to  `fetch`", () => {
        const data = { data: "data" };
        const config = { config: "config" };
        const promise = fetch(URL, data, config);
        const lastReq = fetch.lastReqGet();

        expect(lastReq).toEqual({
            config: {
                ...config
            },
            data,
            promise,
            url: URL,
        });
    });

    // lastPromiseGet - Returns promise of the most recent request
    it("`lastPromiseGet` should return the most recent promise", () => {
        fetch(URL);
        const lastPromise = fetch(URL);

        expect(fetch.lastPromiseGet()).toBe(lastPromise);
    });

    it("`getReqByUrl should return the most recent request matching the url", () => {
        fetch(URL);
        const lastPromise = fetch(URL);

        expect(fetch.getReqByUrl(URL).promise).toBe(lastPromise);
    });

    it("`getReqByUrl should return `undefined` if no matching request can be found", () => {
        fetch(URL);
        expect(fetch.getReqByUrl('non-existing URL')).toBeUndefined();
    });

    // popPromise - Removes the give promise from the queue
    it("`popPromise` should remove the given promise from the queue", () => {
        const firstPromise = fetch(URL);
        const secondPromise = fetch(URL);
        const thirdPromise = fetch(URL);

        expect(fetch.popPromise(firstPromise)).toBe(firstPromise);
        expect(fetch.popPromise(thirdPromise)).toBe(thirdPromise);
        expect(fetch.popPromise(secondPromise)).toBe(secondPromise);

        // queue should be empty
        expect(fetch.lastPromiseGet()).toBeUndefined();
    });

    // popPromise - Removes the give promise from the queue
    it("`popRequest` should remove the given request from the queue", () => {
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

    // reset - Clears all of the queued requests
    it("`reset` should clear all the queued requests", () => {
        fetch(URL);
        fetch(URL);

        fetch.reset();
        fetch.reset();

        expect(fetch.lastReqGet()).toBeUndefined();
    });
});
