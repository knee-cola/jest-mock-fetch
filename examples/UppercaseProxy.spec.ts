import fetch from "../lib/mock-fetch";
import UppercaseProxy from "./UppercaseProxy";

afterEach(() => {
    // cleaning up the mess left behind the previous test
    fetch.reset();
});

it("UppercaseProxy should get data from the server and convert it to UPPERCASE", () => {
    const catchFn = jest.fn();
    const thenFn = jest.fn();

    // using the component, which should make a server response
    const clientMessage = "client is saying hello!";

    UppercaseProxy(clientMessage)
        .then(thenFn)
        .catch(catchFn);

    // since `post` method is a spy, we can check if the server request was correct
    // a) the correct method was used (post)
    // b) went to the correct web service URL ('/web-service-url/')
    // c) if the payload was correct ('client is saying hello!')
    expect(fetch).toHaveBeenCalledWith("/web-service-url/", {
        body: clientMessage,
    });

    // simulating a server response
    fetch.mockResponse({
        text: () => 'server says hello!'
    });

    // checking the `then` spy has been called and if the
    // response from the server was converted to upper case
    expect(thenFn).toHaveBeenCalledWith("SERVER SAYS HELLO!");

    // catch should not have been called
    expect(catchFn).not.toHaveBeenCalled();
});
