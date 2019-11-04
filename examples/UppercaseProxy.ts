const UppercaseProxy = (clientMessage) => {

    // requesting data from server
    const fetchPromise = fetch('/web-service-url/', { data: clientMessage });

    // converting server response to upper case
    const finalPromise = fetchPromise
        .then(response => response.text())
        .then(text => text.toUpperCase());

    // returning promise so that client code can attach `then` and `catch` handler
    return(finalPromise);
};

export default UppercaseProxy;
