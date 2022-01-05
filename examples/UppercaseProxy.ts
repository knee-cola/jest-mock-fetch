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
