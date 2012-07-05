/*
 * chainTimeline.js
 * Simple consistency tool, that will display a timeline to track your daily job. Supports
 * all major browsers - IE7+, Firefox2+, Safari4+, Chrome4+ and Opera 10.5+
 *
 * Known issues:
 * 		- IE9 does not keep persistent data when in system file:// mode
 * 
 * Copyright (c) 2012 Dan Schultzer, Dream Conception, dan@dreamconception.com
 * Project homepage: keep-the-chain.com
 *
 * Licensed under MIT-style license:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * A quick prototype remove function to the array object,
 * so we can easily remove specific values from array.
**/
Array.prototype.remove= function(){
    var what, a= arguments, L= a.length, ax;
    while(L && this.length){
        what= a[--L];
        while((ax= this.indexOf(what))!= -1){
            this.splice(ax, 1);
        }
    }
    return this;
}

/**
 * A quick prototype to add array indexOf functionality.
 * Needed in some browsers that do not have native support.
**/
if (!Array.indexOf) {
	Array.prototype.indexOf = function (obj, start) {
		for (var i = (start || 0); i < this.length; i++) {
			if (this[i] == obj) {
				return i;
			}
		}
		return -1;
	}
}

/**
 * The chain timeline renderer. The renderer will render a year calendar with monthly timelines.
 * 
 * The function object takes the following parameters:
 * 		container: The container element ID
 * 		year: The current year view in full format, e.g. 2012
 * 		loadDataF: The data loader functionality, should return an data object
 * 		saveDataF: The data save functionality, receives an data object
 * 		resetDataF: The data reset functionality, resets the data object
 * 		postProcessF: Function to process something after the renderer has finished
 *
 * This function will return it's own object.
 *
 * Different statistics can be gathered by accessing the object, such as:
 * 		activeDays: Number of days has been checked off
 * 		numberOfChains: Number of chains that exists
 * 		longestChainLength: The number of days in the longest chain that exists
 * 		lastChainLength: The number of days in the latest chain found
 * 		chains: A list of chains, ordered by size of the chain, including the ending day of the chain
 *
 * These statistics are based on the year selected.
**/

var renderChainTimeline = function (container, year, loadDataF, saveDataF, resetDataF, postProcessF) {
	this.monthsOfYear = ["January","February","March","April","May","June","July","August","September","October","November","December"];
	this.daysInWeek = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
	this.activeDays = this.numberOfChains = this.longestChainLength = this.lastChainLength = this.currentlyInChain = 0;
	this.renderTime = false;

	/**
	 * Initializer functionality
	**/
	this.init = function () {

		this.container = $("#" + container);
		
		// Verify that the container exists
		if (this.container.length<1) {
			alert("No container element found");
			return;
		}

		// Setting the standard data
		this.date = (year) ? new Date(year) : new Date();
		this.year = this.date.getFullYear();

		// Load data functionality
		function loadData () { alert("No load method exists!");return {}; };
		this.loadDataFunc = (loadDataF) ? loadDataF : loadData;

		// Save data functionality
		function saveData (data) { alert("No save method exists!"); };
		this.saveDataFunc = (saveDataF) ? saveDataF : saveData;

		// Reset data functionality
		function resetData () { alert("No reset method exists!"); };
		this.resetDataFunc = (resetDataF) ? resetDataF : resetData;
		
		// Post process functionality
		function postProcess (object) { };
		this.postProcessFunc = (postProcessF) ? postProcessF : postProcess;

		// Preparing the container
		this.container.addClass("chainTimeline");

		// Remove the overlays if element is clicked outside
		$("html").bind('click', function () { removeDayOverlay(); });

		// Load in the data
		this.data = this.loadDataFunc();

		// Start render
		this.render();
	}
	
	/**
	 * Function to remove the day overlay
	**/
	this.removeDayOverlay = function () {
		$("li .overlay", this.container).remove();
	}

	/**
	 * A function to calculate the number of days in a month of a year.
	 * Parameters are month (digit from 0 to 11) and year (4 digits, e.g. 2012)
	**/
	this.getDaysInMonth = function (month, year) {
		var days = 32 - new Date(year, month, 32).getDate();
		var returnDays = [];
		for (var i = 0; i < days; i++) {
			var date = new Date(year, month, i);
			returnDays.push({day:i+1,name:this.daysInWeek[date.getDay()],weekend:(date.getDay()>4)?true:false});
		}
		return returnDays;
	}

	/**
	 * A function to re-render with a new year selected
	**/
	this.changeYear = function (year) {
		this.year=year;
		this.render();
	}
	
	/**
	 * A function to render the year controls.
	 * Will return a HTML object.
	**/
	this.renderYearControls = function (year) {
		// Year control element
		var controlElement = $("<ul></ul>");
		controlElement.addClass("yearControls");

		// Function to change year
		function bindYearChange (object, element, year) {
			element.bind("click",function(e){
					object.changeYear(year);
					e.stopPropagation();
					return false;
			});
		}

		// The previous year list item.
		// If there exists data, we will make it clickable.
		var prevYear = year-1;
		var controlsBack = $("<li class='back'>"+prevYear+"</li>");
		if(typeof this.data[prevYear]=="object"){
			controlsBack.html("<a href='#'>"+prevYear+"</a>");
			controlsBack.addClass("link");

			bindYearChange (this, controlsBack, prevYear);
		}
		controlElement.append(controlsBack);

		// Current year list item.
		controlElement.append("<li class='current'>"+year+"</li>");

		// The next year list item.
		// If there exists data, we will make it clickable.
		var nextYear = year+1;
		var controlsForward = $("<li class='forward'>"+nextYear+"</li>");
		if(typeof this.data[nextYear]=="object"){
			controlsForward.html("<a href='#'>"+nextYear+"</a>");
			controlsForward.addClass("link");

			bindYearChange (this, controlsForward, nextYear);
		}
		controlElement.append(controlsForward);
			
		return controlElement;
	}

	/**
	 * Render functionality to render the full timeline view.
	**/
	this.render = function () {
		this.activeDays = this.numberOfChains = this.longestChainLength = this.lastChainLength = this.currentlyInChain = 0;
		this.chains = {};

		var displayRow = false; // We only display a month row if necessary
		this.container.html(""); // Empty the container element
		var today = new Date(); // The date today
		var inChain = false;

		// We create a date object, representing yesterday
		// to use for verifying if we are in a chain, or not
		var yesterday = new Date(today.getTime());
		yesterday.setDate(yesterday.getDate() - 1);

		// Render year controls.
		// Only display it if there is data registered for previous year.
		if(typeof this.data=="object" &&
			(typeof this.data[this.year-1]=="object" ||
			typeof this.data[this.year+1]=="object")
			){

			var controls = this.renderYearControls(this.year);
			this.container.append(controls);
		}
		
		// Go through each month in the year
		for(j = 0; j < this.monthsOfYear.length; j++){

			// Calculate the length of current month in days
			var daysInMonth = this.getDaysInMonth(j, this.year);

			// Create the month days list
			var monthList = $("<ul></ul>");
			monthList.addClass("monthList");

			// Append the month and year column item
			monthList.append("<li class='month'><div class='top'>"+this.monthsOfYear[j]+"</div><div class='bottom'>"+this.year+"</div></li>");
			
			// Add deactivate class to the month head if there is no data in the array, and the month,
			// and year, is not current month itself
			if (
				  (typeof this.data[this.year] != "object" || 
				   typeof this.data[this.year][j] != "object" || 
				   typeof this.data[this.year][j].length<1)
				&&
				  (today.getFullYear() != this.year ||
					(today.getFullYear() == this.year &&
					today.getMonth() != j)
				  )
				) {
				$(".month",monthList).addClass("deactive");
			}

			// Display all the years months if there was data in the previous year
			if (typeof this.data[this.year-1] == "object") {
				displayRow = true;
			}

			// Go through each day in the month
			for (var i = 0; i < daysInMonth.length; i++) {
				var is_completed = false; // If the date is marked completed
				var is_today = false;

				// Setting the weekend
				// if the day is a weekend day
				var weekend = "weekday";
				if(daysInMonth[i].weekend) weekend = "weekend";
				var li = $("<li></li>");
				li.addClass(weekend);

				// Show the list item as today
				// if year, month and date match
				// current javascript date
				if(today.getFullYear() == this.year &&
					today.getMonth() == j &&
					today.getDate() == (i + 1)) {
						li.addClass("today");
						displayRow = true; // Include row
				}

				// Setting the selected
				// if data exist for the year, month,
				// and date
				if(typeof this.data[this.year] == "object" &&
					typeof this.data[this.year][j] == "object" &&
					this.data[this.year][j].indexOf(i)!=-1){

					displayRow = true; // Include row
					is_completed = true;
					li.addClass("checked");

					// If the we are going into chain mode, we will have to
					// calculate the next lastChainLength, as well as increment
					// the number of chains. We also increase the lastChainLength
					// no matter what as well as activeDays
					this.activeDays = this.activeDays+1;
					if (!inChain) {
						this.lastChainLength=0;
						this.numberOfChains = this.numberOfChains+1;
						inChain = true;
					}
					this.lastChainLength = this.lastChainLength+1; 

					// We check if we are currently in a chain
					// Rule: The day before today or the day today has to be checked
					if(
						(today.getFullYear() == this.year &&
							today.getMonth() == j &&
							today.getDate() == (i+1)
						) ||
						(yesterday.getFullYear() == this.year &&
							yesterday.getMonth() == j &&
							yesterday.getDate() == (i+1)
						)	
					) {

						this.currentlyInChain = 1;
					}
				}

				// If data doesn't exists, or this day is the end
				// of the year then we will have to end the chain
				if(typeof this.data[this.year] != "object" ||
					typeof this.data[this.year][j] != "object" ||
					this.data[this.year][j].indexOf(i)==-1 ||
					(j==11 && i==30)){

					// If the we are going away from chain mode, we will have to
					// check if there is a new longestChainLength, as well as
					// record the chain size
					if (inChain) {
						if (this.longestChainLength<this.lastChainLength) this.longestChainLength=this.lastChainLength;
						if(typeof this.chains[this.lastChainLength] == "undefined") this.chains[this.lastChainLength] = new Array();

						// Special condition when there is no more days
						if((j==11 && i==30)) day = i+1;
						else day = i;

						// Add the previous day as the last day of the chain
						this.chains[this.lastChainLength].push({year:this.year,month:(j+1),day:day});
					}
					inChain = false;
				}

				// We only keep the days that has passed or is the today's
				// day active. Any one after will be passive.
				if (this.year<today.getFullYear() ||
					j<today.getMonth() ||
					(j==today.getMonth() &&
					i<today.getDate())
					){

					// Bind the overlay to click functionality
					(function () {
						var year = this.year;
						var month_j = j;
						var day_i = i;
						var weekday_name = daysInMonth[i].name;
						var day_date = day_i+1;
						var month_name = this.monthsOfYear[j];
						var list_item = li;
						var object = this;
						var completed = is_completed;

						list_item.bind("click",function(e){
								object.removeDayOverlay();

								// Create an overlay
								var overlay = $("<div><div class='arrow-up'></div>");
								overlay.addClass("overlay");
								overlay.append("<h3>"+weekday_name+", "+day_date+" "+month_name+" "+object.year+"</h3>");
								overlay.append("<p>Did you do today's job?</p>");
								if(completed) overlay.append("<a href='#' class='remove'>Remove Check</a>");
								else overlay.append("<a href='#' class='complete'>Daily job has been done!</a>");

								// Bind the buttons
								$("a", overlay).bind("click",function(e){
									if (typeof object.data == "object") {
										if(typeof object.data[year] != "object") object.data[year] = {};
										if(typeof object.data[year][month_j] != "object") object.data[year][month_j] = [];
										if(object.data[year][month_j].indexOf(day_i) != -1) object.data[year][month_j].remove(day_i);
										else object.data[year][month_j].push(day_i);

										object.saveDataFunc(object.data); // Save the data

										object.render();
									}
									e.stopPropagation();
									return false;
								});

								list_item.append(overlay);

								// Position the overlay correctly
								var overlayObj = $('.overlay',list_item);
								var margin = (overlayObj.outerWidth()-list_item.width())/2;
								if ((overlayObj.position().left-margin) < 0) {
									margin += (overlayObj.position().left-margin);
								} else if ((overlayObj.position().left+overlayObj.outerWidth()-margin) > $(window).width()) {
									margin += overlayObj.position().left+overlayObj.outerWidth()-margin-$(window).width();
								}
								overlayObj.css({'margin-left': -margin});
								$('.arrow-up', overlayObj).css({'margin-left': margin-parseInt($('.overlay', list_item).css('padding-left'))/2});

								// Detect the correct position for the overlay
								var target = list_item;
								var offset = $(target).offset();
								var curPos = offset.top-$(window).scrollTop();
								var curHeight = $(target).height()+overlay.height();
								if((curPos+curHeight/2)>$(window).height()/2){
									$('html, body').animate({scrollTop: $(target).offset().top-curHeight/2}, 500);
								}


								// No further actions
								e.stopPropagation();
						});
					}());
					
					li.addClass("active"); // Active state
				} else {
					li.addClass("deactive"); // Deactive state
				}

				// Create the li item and append it to the list row
				li.append("<div class='top'>"+daysInMonth[i].name.substring(0,1)+"</div><div class='bottom'>"+daysInMonth[i].day+"</div>");
				monthList.append(li);
			}
			
			// Only display the row if it has been designated as such
			if(displayRow == false) monthList.hide();
			
			this.container.append(monthList);
			
			this.renderTime = new Date();
		}

		// Render reset button.
		var resetControl = $("<a href='#' class='resetData'>Reset Data</a>");
		(function () {
			var object = this;
			var reset_item = resetControl;
			reset_item.bind("click",function(e){
					object.resetDataFunc();
					object.data = object.loadDataFunc();
					object.render();
					e.stopPropagation();
					return false;
			});
		}());
		this.container.append(resetControl);

		// Post processing
		this.postProcessFunc(this);
	}

	// Initialize the object right away
	this.init();

	// Return object
	return this;
}