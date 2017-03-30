/*
 * statsChain.js
 * Script to calculate and siaply different statistics things in the chainTimeline.js
 * script. It is only meant to work with specific stylesheet and HTML setup.
 *
 * Copyright (c) 2012 Dan Schultzer, Dream Conception, dafuh:l21daysn@dreamconception.com
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
 * redoStats functionality.
 * Will display base statistics.
**/
function redoStats(object)
{
	if (typeof object != "object") return;

	$("#active_days").text(object.activeDays);

	if (object.currentlyInChain == 0) {
		var days = 0;
		$("#current_chain_txt").text("Let's go!");
	} else {
		var days = object.lastChainLength;
		$("#current_chain_txt").text("Keep Going");
	}

	$("#current_chain").text(days);
	$("#longest_chain").text(object.longestChainLength);
}

/**
 * Social share functionality
**/
function socialShare(object)
{
	var url = "https://keep-the-chain.com";
	var img = "https://keep-the-chain.com/images/keep-the-chain-badge.png";
	var texts = ["I'm being proactive with Keep the Chain!",
				 "Just killing procrastination...",
				 "Who is awesome like me?",
				 "Let's get going, Keep the Chain!"]
	var text = texts[Math.floor(Math.random()*texts.length)];
	if (object.activeDays>0) {
		// If we are currently in a chain, and the chain is more
		// than a specific length, we change the default message
		if (object.currentlyInChain == 1 && object.lastChainLength>2) {
			text += " "+object.lastChainLength+" days in a row today";
		} else {
			text += " Going at "+object.activeDays+" active day";
			if (object.activeDays>1) text += "s";
		}
	}

	if (typeof object.achievementsList == "object" && object.achievementsList.length>0) {
		text += ", and won "+object.achievementsList.length+" achievement";
		if (object.achievementsList.length>1) text += "s";
	}
	text += "!";

	$(".social.facebook").attr("href","https://www.facebook.com/sharer.php?s=100&p[title]="+encodeURIComponent(text)+"&p[url]="+url+"&p[images][0]="+img);
	$(".social.twitter").attr("href","https://twitter.com/share?text="+encodeURIComponent(text)+"&url="+encodeURIComponent(url)+"&related=dreamconception");
	$(".social.linkedin").attr("href","https://www.linkedin.com/shareArticle?mini=true&url="+encodeURIComponent(url)+"&title="+encodeURIComponent(text));
}

/**
 * Achievements functionality
 * Will calculate achievements, build an array in the object and
 * update the number of achievements won
**/
var first_run = true;
function achievements(object)
{
	if (typeof object != "object") return;
	if (typeof achievementsRuleSet != "object") return;


	// Going through each achievement rule, and build the achievmentsList array
	var achievementsList = new Array();
	for (ruleKey in achievementsRuleSet) {
		var achievementRule = achievementsRuleSet[ruleKey](object);
		if (achievementRule && achievementRule.dates.length>0) {
			for (var i=0;i<achievementRule.dates.length;i++) {
				achievementsList.push({ruleKey:ruleKey,year:achievementRule.dates[i].year,month:achievementRule.dates[i].month,day:achievementRule.dates[i].day,text:achievementRule.text});
			}
		}
	}
	
	// Make a notification when an achievement has been won (this has to be run at least once before notifying,
	// as to not activate at every reload)
	if (!first_run) {
		if (object.achievementsList.length<achievementsList.length) {
			$("#no_achievements")
				.fadeTo('slow', 0.2)
					.fadeTo('slow', 1.0)
						.fadeTo('slow', 0.2)
							.fadeTo('slow', 1.0);
		}
	} else {
		first_run = false;
	}

	// Update the object with the achievmentsList
	object.achievementsList = achievementsList;

	// Update the number of achievments won
	$("#no_achievements").text(object.achievementsList.length);
}

/**
 * Simple script for achievements that can be recurring (thus we need
 * to go through the chains array)
**/
function recurringAchievement(object, minimum_days, return_text) {
	var return_arr = {dates:[],text:return_text};
	for (days in object.chains) {
		if (days>=minimum_days) {
			for (var i=0;i<object.chains[days].length;i++) {
				var achievementWonDate=new Date(object.chains[days][i].year, object.chains[days][i].month-1, object.chains[days][i].day);
				achievementWonDate.setDate(achievementWonDate.getDate()-(days-minimum_days));
				return_arr.dates.push({year:achievementWonDate.getFullYear(),month:achievementWonDate.getMonth()+1,day:achievementWonDate.getDate()});
			}
		}
	}
	return return_arr;
}

/**
 * The achievements rule set. A list of functions.
**/
var achievementsRuleSet = {
	theBeginning: function(object) {
		if (object.longestChainLength>=2)
			return {dates:[{year:object.year,month:-1,day:-1}],text:"You have begun the journey to kill procrastination, and reach a consistent level. If you keep it up, you will receive more badges!"};
		return false;
	},
	fullWeek: function(object) {
		return recurringAchievement(object, 7, "7 days continued effort! Keep it up, and you will soon reach the new plateau. Try go for 90 days!");
	},
	full14days: function(object) {
		return recurringAchievement(object, 14, "2 weeks is great, now you just need finish the month out!");
	},
	full21days: function(object) {
		return recurringAchievement(object, 21, "21 days is the average to learn a new habit, great!");
	},
	full30days: function(object) {
		return recurringAchievement(object, 30, "Wow, 30 days straight! You just keep going, and going?");
	},
	full60days: function(object) {
		return recurringAchievement(object, 60, "You have done 60 days straight, only 30 more days to do a complete rewire of your neuronal network!");
	},
	newSkill: function(object) {
		return recurringAchievement(object, 90, "90 days continued effort! You have rewired your neuronal network to lay off old habits, and to continue a proactive lifestyle. Time for a half year challenge?");
	},
	halfYearActiveDays: function(object) {
		if (object.activeDays>=180)
			return {dates:[{year:object.year,month:-1,day:-1}],text:"Congrats, you have been active 6 months of this year! That is impressive, something very few people do."};
		return false;
	},
	halfYearActiveDays: function(object) {
		if (object.activeDays>=(new Date(object.year,11,31)-new Date(object.year,0,0))/(1000*60*60*24))
			return {dates:[{year:object.year,month:-1,day:-1}],text:"Congrats, you have been active all days in this year! You will keep continuing?"};
		return false;
	},
	over9000ActiveDays: function(object) {
		if (object.activeDays>9001)
			return {dates:[{year:object.year,month:-1,day:-1}],text:"Your active number of days... It's OVER NINE THOUSAAAANDD!"};
		return false;
	}
};

/**
 * Achievements display.
 * Will build the overlay box for the achievements, if there is any achievements.
**/
function achievementsBox(object)
{
	if (typeof object != "object") return;
	if (typeof object.achievementsList != "object" || object.achievementsList.length<1) return;

	// Remove previous achievements box, if exists, and create a new one
	$("#achievements_box").remove();
	$("#no_achievements").parent().append('<div id="achievements_box"><div class="container"><h3>Achievements</h3><ul></ul></div></div>');
	for (var i=0;i<object.achievementsList.length;i++) {
		var date_txt = '';
		var date_year = object.achievementsList[i].year;
		var date_month = object.achievementsList[i].month;
		var date_day = object.achievementsList[i].day;
		if(object.achievementsList[i].month>0 && object.achievementsList[i].day>0) date_txt = '<span>'+date_year+'-'+date_month+'-'+date_day+'</span>';
		$("#achievements_box ul").append('<li><img src="style/img/badge.png" title="'+object.achievementsList[i].ruleKey+'">'+object.achievementsList[i].text+date_txt+'</li>');
	}
	$("#achievements_box").append('<div class="arrow-down"></div');
	$("#achievements_box").hide();

	// Add click functionality to the achievements number, so
	// the achievements box can be displayed
	$("#no_achievements").bind('click', function(e){
												$('#achievements_box').show();
												$("#no_achievements").addClass("active");
												e.stopPropagation();
	});
	$("#no_achievements").css({cursor:"pointer"});

	// If a remove bind has not been set,
	// then add one to hide achievements box
	if (!remove_bind_achievements_box){
		$("html").click(function () { 
								$("#achievements_box").hide();
								$("#no_achievements").removeClass("active");
		});
		var remove_bind_achievements_box = true;
	}
}

/**
 * Count down timer.
 * Will display a count down timer, for end of day.
**/
function countdownTimer()
{
	if (typeof chainTimelineObj != "object") return;

	var end_of_day = new Date();
	end_of_day.setHours(23,59,59,999); // End of the day
	var today = new Date(); // The time now

	// Simple check if the date has changed and we should update the render
	if(chainTimelineObj.renderTime != false && 
		today.getDate() > chainTimelineObj.renderTime.getDate()) {
		chainTimelineObj.render();
	}

	function timeVal(num) {
		return (num < 10 ? "0" : "" ) + num;
	}

	var seconds = (end_of_day.getTime()-today.getTime()) / 1000;

	var hours = Math.floor(seconds / 3600);
	seconds = seconds % 3600;
	var minutes = Math.floor(seconds / 60);
	seconds = seconds % 60;
	var seconds = Math.floor(seconds);

	hours = timeVal(hours);
	minutes = timeVal(minutes);
	seconds = timeVal(seconds);

	// Check if the day has been completed
	var completed = false;
	if(typeof chainTimelineObj.data == "object" && 
		typeof chainTimelineObj.data[today.getFullYear()] == "object" &&
		typeof chainTimelineObj.data[today.getFullYear()][today.getMonth()] == "object" &&
		chainTimelineObj.data[today.getFullYear()][today.getMonth()].indexOf(today.getDate()-1)!=-1){
		completed = true;
	}

	// We use different text for different situations
	if (completed) {
		txt_left = "Completed";
		$("#time_left_txt").text("Time to relax");
	} else {
		if (hours<1) {
			var txt_left = minutes + ":" + seconds + "<span>minutes</span>";
		} else {
			var txt_left = hours + ":" + minutes + ":" + seconds;
		}

		if(chainTimelineObj.currentlyInChain == 0) {
			$("#time_left_txt").text("left of the day");
		} else {
			$("#time_left_txt").text("left to keep chain");
		}
	}

	// Update the time
	$("#time_left").html(txt_left);
}

/**
 * Function to start the timer.
 * Will only start if the chainTimelineObj object exists.
**/
function startTimer() {
	if(typeof chainTimelineObj == "object") {
		countdownTimer();
		var counter=setInterval("countdownTimer()",1000);
	}
}
