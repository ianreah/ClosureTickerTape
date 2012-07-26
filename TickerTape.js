goog.provide('tickerTape');

goog.require('goog.dom');
goog.require('goog.string.format');
goog.require('goog.net.XhrIo');
goog.require('goog.style');
goog.require('goog.fx.Animation');

goog.require('tickerTape.templates');

// The list of stock symbols we're interested in
/** @private */
tickerTape.interestingStocks =
	["HSBA.L", "RDSA.L", "BP.L", "VOD.L", "GSK.L", "AZN.L", "BARC.L", "BATS.L", "RIO.L", "BLT.L"];

// Time taken to scroll the width of one item in the ticker (in milliseconds)
/** @private */
tickerTape.animationDuration = 5000;

/**
 * The main entry point for building the ticker tape
 * @param {string} elementId The name of the DOM element in which to place the ticker tape
 */
tickerTape.insert = function(elementId) {

	// Format this string with the list of stock symbols to build the YQL query for retrieving stock quotes
	// (read more on YQL here - http://developer.yahoo.com/yql/)
	var queryStringFormat = 'http://query.yahooapis.com/v1/public/yql?\
					q=select * from yahoo.finance.quotes where symbol in ("%s")\
					&env=store://datatables.org/alltableswithkeys&format=json';

	var queryString = goog.string.format(queryStringFormat, tickerTape.interestingStocks);

	// Request the stock quotes...
	// (The callback function gets registered as an event listener through a call to 'goog.events.listen' within the send function.
	// More on events in google closure here - http://code.google.com/closure/library/docs/events_tutorial.html)
	goog.net.XhrIo.send(queryString, function(completedEvent) {

		// ...and then build up our ticker tape information when we get the response.
		// (The event's target is the XhrIo instance that was used to send the request so
		// we can use it here to get to the response)
		var xhr = completedEvent.target;	
		var json = xhr.getResponseJson();
		
		var tickerContainer = goog.dom.getElement(elementId);
		for(var i = 0; i < json.query.count; i++) {
			tickerContainer.innerHTML += tickerTape.templates.stockItem(json.query.results.quote[i]);
		}
		
		// Start the ticker animation...
		tickerTape.start(tickerContainer);
	});
}

/**
 * Animate the ticker
 * @param {Element} tickerContainer The DOM element in which we've placed the ticker tape
 * @private
 */
tickerTape.start = function(tickerContainer) {
	// Note - we're assuming that all items in the ticker have the same width (styled in css)
	var firstItem = goog.dom.getFirstElementChild(tickerContainer);
	var itemWidth = goog.style.getSize(firstItem).width;
	
	// Make sure the container is set up properly for us to be able to influence its position
	goog.style.setStyle(tickerContainer, 'position', 'relative');
	goog.style.setWidth(tickerContainer, itemWidth * tickerTape.interestingStocks.length);
	
	// We animate for the width of one item...
	var startPosition = goog.style.getPosition(tickerContainer);
	var animation = new goog.fx.Animation([ startPosition.x , startPosition.y ] , [ startPosition.x - itemWidth, startPosition.y ], tickerTape.animationDuration);
	
	goog.events.listen(animation, goog.fx.Animation.EventType.ANIMATE, function(event) {
		goog.style.setPosition(tickerContainer, event.x, event.y);
	});
	
	// ...and then shuffle the items around (removing the first item & adding it to the end)
	// and repeat the animation.
	// This	gives the effect of a continuous, wrapping ticker.
	goog.events.listen(animation, goog.fx.Animation.EventType.END, function(event) {
		firstItem = goog.dom.getFirstElementChild(tickerContainer);
		goog.dom.removeNode(firstItem);
		goog.dom.appendChild(tickerContainer, firstItem);
		
		animation.play();
	});
	
	animation.play();
}