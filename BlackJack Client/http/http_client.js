export function sendGetRequest(url, callback, errorCallback) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function(){
        if(httpRequest.readyState == 4){
            if(httpRequest.status == 200){
                callback(httpRequest.responseText);
            } else {
                errorCallback(httpRequest.responseText);
            }
        }
    };

    httpRequest.open("GET", url, true);
    httpRequest.send();
}

export function sendPostRequest(url, callback, body, errorCallback) {
    let httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function(){
        if(httpRequest.readyState == 4){
            if(httpRequest.status == 200){
                callback(httpRequest.responseText);
            } else {
                errorCallback(httpRequest.responseText, httpRequest.status);
            }
        }
    };

    httpRequest.open("POST", url, true);
    httpRequest.send(body);
}