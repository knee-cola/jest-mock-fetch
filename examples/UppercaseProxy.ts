const UppercaseProxy = (clientMessage) => {

    // requesting data from server
    const unfetchPromise = fetch("/web-service-url/", { data: clientMessage });

    // converting server response to upper case
    const unfetchPromiseConverted = unfetchPromise.then((serverData) =>
        serverData.data.toUpperCase(),
    ).catch(() => {
        console.log("catched!");
    });

    // returning promise so that client code can attach `then` and `catch` handler
    return unfetchPromiseConverted;
};

export default UppercaseProxy;
