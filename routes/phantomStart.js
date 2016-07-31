// initialize variables needed across functions
var page = require('webpage').create(),
    system = require('system'),
    //the URL to check
    urlToCheck = system.args[1],
    //the links on the above URL
    linksToClick = undefined,
    pageTimers = [],
    requestMap = {},
    //to filter for only analytics requests
    //add other analytics filters like GA as desired
    resourcesToLog = [new RegExp('\/b\/ss\/')],
    //the array of links that did not pass
    qaResults = [],
    //array of hrefs that are passing Adobe Analytics correctly
    urlEvars = [];

page.onConsoleMessage = function(msg) {
    system.stderr.writeLine('console: ' + msg);
};

page.onError = function(msg, trace) {
    pageTimers = [setTimeout(endQA, 30000)];
};

// make a note of any errors so we can print them out
page.onResourceError = function(resourceError) {
    page.error = JSON.stringify(resourceError);
};
// called every time a resource is requested- important for detecting analytics beacons
page.onResourceRequested = function(requestData, networkRequest) {
    // loop through resourcesToLog to see if this url matches any of them
    var length = resourcesToLog.length;
    while (length--) {
        //a string that includes the current URL and javascript files
        var preRegEx = '^' + urlToCheck + (urlToCheck.slice(-4) == "html" ? "$|api\.demandbase|assets\.adobedtm\.com|ooyala|\.js$" : (urlToCheck.slice(-1) == '/' ? '$|api\.demandbase|assets\.adobedtm\.com|ooyala|\.js$' : '/$|api\.demandbase|assets\.adobedtm\.com|ooyala|\.js$'));
        //regex of above string
        var addressRegex = new RegExp(preRegEx);
        //only allow requests to adobe analytics
        if (resourcesToLog[length].test(requestData.url) || (/servicenowinc\.d2\.sc\.omtrdc\.net/).test(requestData.url)) {
            var match = (requestData.url).match(/.+\?(.+)/)[1];
            var matchArr = match.split('&');
            var tempValue = '';
            matchArr.forEach(function(e) {
                var key = e.match(/(.+)=(.+)/)[1];
                var value = decodeURIComponent(e.match(/(.+)=(.+)/)[2]);
                //prop8 is the traffic variable that holds the href of a link clicked
                if ((/^c8/).test(key)) {
                    tempValue = value;
                }
                //eVar22 is the conversion variable that holds the link click value for reporting
                if ((/^v22/).test(key)) {
                    if (tempValue) urlEvars.push(tempValue);
                    tempValue = undefined;
                    removeTimers();
                    pageTimers = [setTimeout(endQA, 20000)];
                }
            });
        //abort request if the request is not adobe analytics, current URL, or javascript
        } 
        else if (!(addressRegex).test(requestData.url)) {
            removeTimers();
            pageTimers = [setTimeout(endQA, 20000)];
            networkRequest.abort();
        } 
        //if it matches regex, allow but reset timeouts
        else {
            removeTimers();
            pageTimers = [setTimeout(endQA, 20000)];
        }
    }
};
//function to remove all setTimeouts
//using array of setTimeouts bc otherwise hard to remove multiple timeouts
function removeTimers() {
    for (var y = 0; y < pageTimers.length; y++) {
        clearTimeout(pageTimers[y]);
    }
}
//process the passed URL
function handleUrl(theUrl) {
    removeTimers();
    //use phantom to open the page
    page.open(theUrl, function(status) {
        //if page fails to load, end
        if (status !== 'success') {
            endQA();
            // console.log("FAILED: to load " + theUrl);
            // console.log(page.error);
        } 
        else {
            // console.log('Wild', theUrl, 'appeared!');

            //evaluate the page to click and process all links
            page.evaluate(function(theUrl) {
                //all links with href on page
                linksToClick = document.querySelectorAll('a[href]');
                // console.log('Gotta Catch \'Em All:', linksToClick.length);

                for (var i = 0; i < linksToClick.length; i++) {
                    linksToClick[i].onclick = function() {
                        //prevent new pages from loading
                        event.preventDefault();
                        event.stopPropagation();
                        //must have an equivalent method available on your page via DTM
                        //processTic is custom middleware that sets the relevant variables and then invokes s.tl() with the data
                        _A.core.processTic(event);
                    }
                }
            }, theUrl);

            //initialize qaResults to all the anchors with href
            qaResults = page.evaluate(function(){
                var temp = [];
                for (var i = 0; i < linksToClick.length; i++) {
                    temp.push(linksToClick[i].getAttribute('href'))
                }
                return temp;
            })
            //if the page loaded but there are no hrefs, the test will return "PAGE IS BROKEN"
            if(qaResults.length === 0) qaResults = ["PAGE IS BROKEN"]
            
            //click all the href links
            page.evaluate(function() {
                for (var i = 0; i < linksToClick.length; i++) {
                    //not clicking all links right away because there are too many requests, bad things happen
                    setTimeout(linksToClick[i].click(), 1000);
                }
            })
        }
    });
};
//the final function to call before exiting
function endQA() {
    //no more setTimeouts
    removeTimers();

    if(urlEvars.length > qaResults.length) {
        console.log('CHECK URL AND TRY AGAIN :(\n******************************************************************************************************\n******************************************************************************************************');
        phantom.exit();
    }
    else{
        //remove all good/passing link clicks from qaResults
        if(urlEvars.length > 0 && qaResults.length > 1) {
            for(var i = urlEvars.length-1; i >= 0; i--) {
                for(var j = qaResults.length-1; j >= 0; j--){
                    if((new RegExp(urlEvars[i].replace('?', ''))).test(qaResults[j].replace('?', ''))){
                        qaResults.splice(j, 1);
                        break;
                    }
                }
            }
        }
        //removing blank results from array
        for(var k = qaResults.length-1; k >= 0; k--){
            if(qaResults[k].length === 0){
                qaResults.splice(k, 1);
                break;
            }
        }
        //output the URL checked
        console.log(urlToCheck.toUpperCase());
        var toWrite = ( urlEvars.length === 0 ? 'CHECK URL AND TRY AGAIN :(\n' : (qaResults.length === 0 ? 'Of ' + urlEvars.length + ' links checked ' + 'there were no issues!!' : 'Of ' + urlEvars.length + ' links checked, number of issues: ' + qaResults.length + '\ncheck links:\n' + qaResults.join(',\n')) ) + '\n******************************************************************************************************\n******************************************************************************************************';
        //console log is how we are currently passing data to phantomScript.js to display on phantomPage.jade
        console.log(toWrite);
        //exit phantomjs
        phantom.exit();
    }
}
//call main function with the URL
handleUrl(urlToCheck);