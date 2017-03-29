/*
 * syncChain.js
 * Script to synchronize chain with keep-the-chain server
 *
 * Note: Access-Control-Allow-Origin needs to be taken care of, if used
 * 			cross-site.
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
 
 var syncChainData = function (container, chainTimelineObj, loadDataF, saveDataF) {
 	this.syncAuthData = new Object();
 	this.syncAuthData.enabled = false;
 	this.syncAuthData.username = this.syncAuthData.sync_id = '';
 	this.syncAuthData.version = -1;
 	this.domain = 'https://keep-the-chain.com/';

	/**
	 * Initializer functionality
	**/
	this.init = function () {

		// Set container
		this.synhronizationDisplayContainer = $("#" + container);

		// Verify that the container exists
		if (this.synhronizationDisplayContainer.length<1) {
			alert("No container element found for synchronization module");
			return;
		}

		// Preparing the container
		this.synhronizationDisplayContainer.addClass("synchronizationControls");

		// Set the overlay object
		this.overlayObj = this.overlayHandler();

		// Set the chainTimeline object
		this.chainTimelineObj = chainTimelineObj;

		// Load data functionality
		if (typeof loadDataF != 'function') { alert("Synchronization needs a load data function"); return;}
		this.loadAuthorizationData = loadDataF;

		// Load data functionality
		if (typeof saveDataF != 'function') { alert("Synchronization needs a save data function"); return;}
		this.saveAuthorizationData = saveDataF;

		// Get current synchronization data
		var syncdata = this.loadAuthorizationData();

		// Check if synchronization is enabled already
		if (typeof syncdata == 'object' && syncdata!=null) {
			this.syncAuthData = syncdata;
		}

		// Update the base functions
		this.updateTimelineFunctions();

		// Re-render the timeline synchronization module
		this.buildDisplay();

		// Enable status bar scrolling
		this.enableStatusBarScrolling();

		// Set cross domain
		$.support.cors = true;

		// If the synchronization is enabled, we will authorize
		// and enable access
		if (this.syncAuthData.enabled == true) {
			this.enableSync(this.syncAuthData.username, this.syncAuthData.sync_id);
		}
		
	}

	/**
	 * Function to save the synchronization authentication details
	**/
	this.saveSyncAuth = function(enabled, username, sync_id) {
		this.syncAuthData.enabled = enabled;
		this.syncAuthData.username = username;
		this.syncAuthData.sync_id = sync_id;
		this.saveAuthorizationData(this.syncAuthData);
	}
	
	/**
	 * Function to save the update the synchronized version
	**/
	this.updateSyncVersion = function(version) {
		this.syncAuthData.version = version;
		this.saveAuthorizationData(this.syncAuthData);
	}
	
	/**
	 * Function to update the status message for synchronization
	**/
	this.updateStatus = function(message) {
		if (message == '' && $('#syncStatus').is(":visible")) $('#syncStatus').hide();
		else if (message != '' && !$('#syncStatus').is(":visible")) this.fade($('#syncStatus'), 'in', '400');

		$('#syncStatus', this.synhronizationDisplayContainer).html(message);
	}

	/**
	 * Function to update base functionality, to include synchronization
	 * functionality
	**/
	this.updateTimelineFunctions = function() {
		// We want to make sure that any updates,
		// will be parsed unto the server
		eval('this.orgsaveDataFunc = ' + this.chainTimelineObj.saveDataFunc.toString());
		this.chainTimelineObj.saveDataFunc = function(obj){
			// Reuse the old save functionality
			this.orgsaveDataFunc(obj);

			// Save an updated version number, and synchronize
			this.updateSyncVersion(parseInt(this.syncAuthData.version)+1);
			this.synchronize(obj);
		}
	}
	
	/**
	 * Function that will make the status bar follow the screen
	**/
	this.enableStatusBarScrolling = function() {
		// This function will be executed when the user scrolls the page.
		$(window).scroll(function(e) {
			var scrollObj =  $("#syncStatus", this.synhronizationDisplayContainer);
			if (scrollObj.length<1) return;

			var scrollAnchorObj =  $(".syncData", this.synhronizationDisplayContainer);
			if (scrollAnchorObj.length<1) return;

			var docViewTop = $(window).scrollTop();
			var docViewBottom = docViewTop + $(window).height() - $("#footer").height();

			var elemTop = scrollAnchorObj.offset().top;
			var elemBottom = elemTop + scrollAnchorObj.height();

			// Element is inside window view
			if ((elemBottom <= docViewBottom) && (elemTop >= docViewTop)) {
				scrollObj.css({'position': 'relative', 
							   'bottom': 0,
							   'left': 0});
			// Element is below window view
			} else if (elemTop > docViewTop) {
				scrollObj.css({'position': 'fixed',
							   'top': 'auto',
							   'bottom': $("#footer").height(),
							   'left': 0});

			// Element is above window view
			} else if (elemBottom < docViewBottom) {
				scrollObj.css({'position': 'fixed',
							   'top': 0,
							   'bottom': 'auto',
							   'left': 0});
			}
		});
	}

	/**
	 * Function to append link HTML
	**/
	this.buildDisplay = function () {
		$(this.synhronizationDisplayContainer).html('');

		// Append the synchronization button
		$(this.synhronizationDisplayContainer).append(this.buildSyncbutton());

		// Append a status wrapper for the synchronization calls
		$(this.synhronizationDisplayContainer).append(this.buildStatusDiv());

		// Trigger scroll function
		$(window).scroll();
	}
	
	/**
	 * Function to build the sync button
	**/
	this.buildSyncbutton = function () {
		// Display different a turn on, or turn off button
		// depending on if synchronization is enabled, or not
		if (this.syncAuthData.enabled == true) {
			var syncButton = $('<a href="#" class="syncData on">Turn Sync Off</a>');
			(function () {
				var object = this;
				var button = syncButton;
				button.bind('click', function(e){
					object.disableSync();

					e.stopPropagation();
					return false;
				});
			}());
		} else {
			var syncButton = $('<a href="#" class="syncData off">Turn Sync On</a>');
			(function () {
				var object = this;
				var button = syncButton;
				button.bind('click', function(e) {
					if (object.syncAuthData.username.length > 0 && object.syncAuthData.sync_id.length > 0) {
						object.enableSync(object.syncAuthData.username, object.syncAuthData.sync_id);
					}else {
						object.displaySynchronizeAuthOverlay();
					}
					e.stopPropagation();
					return false;
				});
			}());
		}
		
		return syncButton;
	}
	
	/**
	 * Function to build the info div
	**/
	this.buildStatusDiv = function () {
		return $('<div id="syncStatus"></div>');
	}

	/**
	 * Function to enable data synchronization.
	 * It will contact the server, and verify that the user is valid.
	**/
	this.enableSync = function (username, sync_id) {

		// Show a loading status
		this.updateStatus('Authorizing user...  <img src="style/img/loader.gif" alt="Loading" />');

		// We will have to check synchronization authorization
		$.ajax({
			type: 'POST',
			url: this.domain+'/ajax_sync.php',
			data: {
				'action': 'auth',
				'username': username,
				'sync_id': sync_id
			},
			dataType: 'json',
			cache: false,
			timeout: 7500,
			context: this,
			success: function(data){

						// If user is authorized
						if (data!=null && data.auth == true) {

							// Set the new variables
							this.saveSyncAuth (true, username, sync_id);

							// Re-render the timeline to make sure that the button is included
							// and update the status
							this.buildDisplay();
							this.updateStatus('User has been authorized.');

							// Synchronize the data
							this.synchronize(this.chainTimelineObj.data);

						// If user is not authorized
						} else if (data!=null && data.error != null) {

							// Alert user, and remove saved sync id
							this.updateStatus(data.error);
							this.saveSyncAuth (false, username, '');
							alert(data.error);

							// Re-render the timeline to make sure that the button is included
							this.buildDisplay();

						// If invalid data return, catch and output error
						} else {
							this.updateStatus('Server error occurred... Will try again later, or at refresh.');
						}

			},
			error: function(XMLHttpRequest, textStatus, errorThrown){
				this.updateStatus('An error occurred when trying to connect with the server.');
			}
		});
	}

	/**
	 * Function to disable data synchronization
	**/
	this.disableSync = function () {
		this.saveSyncAuth (false, this.syncAuthData.username, '');
		this.buildDisplay();
		this.updateStatus('Synchronization has been disabled.');
	}

	/**
	 * Function to synchronize data to server
	**/
	this.synchronize = function (chainData) {

		// Do not synchronize if synchronization is not enabled
		if (this.syncAuthData.enabled != true) return;

		// Show a loading status
		this.updateStatus('Synchronizing data with server, please wait... <img src="style/img/loader.gif" alt="Loading" />');

		$.ajax({
			type: 'POST',
			url: this.domain+'/ajax_sync.php',
			data: {
				'action': 'synchronize',
				'username': this.syncAuthData.username,
				'sync_id': this.syncAuthData.sync_id,
				'version': this.syncAuthData.version,
				'chainData': chainData
			},
			dataType: 'json',
			cache: false,
			timeout: 7500,
			context: this,
			success: function(data){

						// If data has been synchronized
						if (data!=null && data.synchronized == true) {
		
							// Update the synchronization version.
							// Should ALWAYS use the servers
							this.updateSyncVersion(data.version);

							// If the server told that it has more fresh data,
							// then we will have to update the timeline
							if (data.newest == 'server' && typeof data.chainData == "object") {

								// Save the new data to the local storage
								this.chainTimelineObj.saveDataFunc(data.chainData);
		
								// Re-render the timeline with the new data
								this.chainTimelineObj.data = data.chainData;
								this.chainTimelineObj.render();

								this.updateStatus('New data retrieved from the server, updated timeline accordingly.');

							// Data has been saved to server
							} else {
								this.updateStatus('Data has been synchronized.');
							}

						// If data could not be synchronized, display error
						} else if (data != null && data.error != null) {
							this.updateStatus(data.error);
							
							// This is an issue with the authorization
							if (data.auth == false) {

								// Alert user, and remove saved sync id
								this.saveSyncAuth (false, this.syncAuthData.username, '');
								alert(data.error);

								// Re-render the timeline to make sure that the button is included
								this.chainTimelineObj.render();
							}

						// If invalid data return, catch and output error
						} else {
							this.updateStatus('Server error occured... Will try again later, or at refresh.');
						}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown){
				this.updateStatus('There appears to be a connection error. Could not synchronize data!');
			}
		});
	}
	
	/**
	 * Function to display an overlay for connecting to synchronization
	 * server
	**/
	this.displaySynchronizeAuthOverlay = function () {
		var synchronizeDataID = 'synchronizeData';

		// The first dialog will be the e-mail address
		// that needs to be entered, to retrieve the
		// Synchronization ID
		if (this.syncAuthData.username.length<1) {
			var html = $(
'<h2>Enter E-mail</h2>'+
'<p>We will send you an e-mail with the <strong>Synchronization ID</strong> you will need to access your synchronization account.</p>'+
'<p>If you already have a synchronization account, you will just receive a new ID while your data will be preserved.</p>'+
'<form>'+
	'<p><input type="text" name="email" placeholder="Enter your e-mail address" /></p>'+
	'<p class="submit"><input type="button" value="Get Synchronization ID in E-mail" /></p>'+
	'<p class="loader"><img src="style/img/loader.gif" alt="Loading" /></p>'+
'</form>'
);

			(function () {
				var object = this;
				var htmlObj = html;
				var dialog_id = synchronizeDataID;

				// Bind "retrive sync id" action to the submit button
				$('.submit input', html).bind('click', function(e) {

					// We will check if the email seams valid
					var email = $('input[name="email"]', htmlObj).val();
					if (email.length<1) {
						alert('Please enter a valid e-mail.');
						return;
					}

					// Display the loader, and hide the button to prevent 
					// accidental double submission
					$('.submit', htmlObj).hide();
					$('.loader', htmlObj).show();

					// Do an AJAX call to submit the e-mail
					$.ajax({
						type: 'POST',
						url: object.domain+'/ajax_sync.php',
						data: {
							'action': 'sync_id',
							'email': email
						},
						dataType: 'json',
						success: function(data){
							// If the e-mail was accepted, we will redo the display
							// of the synchronizeData dialog
							if (typeof data == 'object' && data.sync_id_created == true) {
								object.syncAuthData.username = data.username;
								object.overlayObj.clear_overlay(dialog_id);
								object.displaySynchronizeAuthOverlay();

							// If the e-mail was not excepted, we will alert the user
							} else {
								$('.submit', htmlObj).show();
								$('.loader', htmlObj).hide();
								alert(data.error);
							}
						},
						error: function(XMLHttpRequest, textStatus, errorThrown){
							$('.submit', htmlObj).show();
							$('.loader', htmlObj).hide();
							alert('An error occurred when trying to connect with the server. Try again later.');
						}
					});
					e.stopPropagation();
				});
			}());


		// The second dialog will be input
		// of the Synchronization ID to verify
		// that the user is valid
		} else {
			var html = $(
'<h2>Enter Synchronization ID</h2>'+
'<p>If you do not already have it, you should receive a Synchronization ID e-mail in less than 10 minutes. Check the spam folder if you can\'t find it.</p>'+
'<p>If you wish to use a new e-mail, or use another e-mail address, you can submit your e-mail one more time by <a href="#" class="removeUsername">clicking here</a>.</p>'+
'<form>'+
	'<p><input type="text" name="username" value="'+this.syncAuthData.username+'" placeholder="Enter your e-mail" /></p>'+
	'<p><input type="text" name="sync_id" value="'+this.syncAuthData.sync_id+'" placeholder="Enter the Synchronization ID" /></p>'+
	'<p class="loader"><img src="style/img/loader.gif" alt="Loading" /></p>'+
	'<p class="submit"><input type="button" value="Start Synchronization" /></p>'+
'</form>');
			(function () {
				var object = this;
				var htmlObj = html;
				var dialog_id = synchronizeDataID;

				// Add functionality to the removeUsername link,
				// that will remove sync auth credentials, and
				// redo the dialog display
				$('.removeUsername', html).bind('click', function(e) {
					object.saveSyncAuth(false, '', '');
					object.overlayObj.clear_overlay(dialog_id);
					object.displaySynchronizeAuthOverlay();

					e.stopPropagation();
				});

				// Bind "authorize user" action to the submit button
				$('.submit input', html).bind('click', function(e) {

					// We will check if the email seams valid
					var username = $('input[name="username"]', htmlObj).val();
					if (username.length<1) {
						alert('Please enter a valid e-mail.');
						return;
					}

					// We will check if the Synchronization ID is valid
					var sync_id = $('input[name="sync_id"]', htmlObj).val();
					if (sync_id.length<1) {
						alert('Please enter a valid Synchronization ID.');
						return;
					}

					// Enable synchronization, and remove the overlay
					object.enableSync(username, sync_id);
					object.overlayObj.clear_overlay(dialog_id);

					e.stopPropagation();
				});
			}());
		}

		// Display the overlay
		this.overlayObj.toggle_overlay('synchronizeData',html,true,true);
	}
	
	/**
	 * Functionality to fade in/out, using CSS3 or jQuery
	**/
	this.fade = function (object, direction, miliseconds)
	{
		// Make sure transition has been checked for
		this.checkForCSS3Transition();
		
		// CSS3 transition
		if (this.transitionSupported) {
			$(object).css({
						'-webkit-transition': 'opacity '+miliseconds+'ms ease-in-out',
						'-moz-transition': 'opacity '+miliseconds+'ms ease-in-out',
						'-o-transition': 'opacity '+miliseconds+'ms ease-in-out',
						'-ms-transition': 'opacity '+miliseconds+'ms ease-in-out',
						'transition': 'opacity '+miliseconds+'ms ease-in-out'});
			if (direction=='out') {
				// Make sure object is visible
				$(object).show();

				// Start animation
				$(object).css({'opacity':'0','pointer-events': 'none'});
			} else {
				// Make sure that the animation will be triggered, and object is not hidden
				$(object).css({'opacity':'0','pinter-events':'none'}).show();

				// Run after, to trigger CSS3 animation, in case an append has been done
				setTimeout(function(){$(object).css({'opacity':'1','pointer-events':'auto'});},1);
			}

		// jQuery fadein/out
		} else {
			if (direction == 'out') $(object).fadeOut(miliseconds);
			else $(object).fadeIn(miliseconds);		
		}
	}

	/**
	 * Test for CSS3 transition
	**/
	this.checkForCSS3Transition = function ()
	{
		if (typeof this.transitionSupported != "boolean") {
			this.transitionSupported = false;

			var b = document.body || document.documentElement;
			var s = b.style;
			var p = 'transition';
			if(typeof s[p] == 'string') { this.transitionSupported = true; }

			// Tests for vendor specific prop
			v = ['Moz', 'Webkit', 'Khtml', 'O', 'ms'],
			p = p.charAt(0).toUpperCase() + p.substr(1);
			for(var i=0; i<v.length; i++) {
				if(typeof s[v[i] + p] == 'string') { this.transitionSupported = true; }
			}
		}
	}

	/**
	 * A simple overlay handler script.
	 * Will be able to mange several overlays, and recall them.
	**/
	this.overlayHandler = function () {
		this.$overlay_wrapper = new Object();
		this.$overlay_panel = new Object();

		this.toggle_overlay = function (k, html, show, clickoverlay) {
			if (show == true) {
				if ( typeof this.$overlay_wrapper[k] == 'undefined' ) this.append_overlay(k, html, clickoverlay);
				this.fade(this.$overlay_wrapper[k], 'in', '400');
				$('BODY').addClass('noscroll');
			} else {
				if ( typeof this.$overlay_wrapper[k] != 'undefined' ) this.fade(this.$overlay_wrapper[k], 'out', '400');;
				$('BODY').removeClass('noscroll');
			}
		}

		this.append_overlay = function (k, html, clickoverlay) {
			this.$overlay_wrapper[k] = $('<div class="complete-overlay" id="'+k+'"></div>').appendTo( $('BODY') );
			this.$overlay_panel[k] = $('<div class="overlay-panel"></div>').appendTo( this.$overlay_wrapper[k] );
	
			if ( clickoverlay ) {
				(function () {
					var object = this;
					this.$overlay_wrapper[k].bind('click', function(){object.toggle_overlay(k,'',false,false);}); // Hide when clicked overlay
					this.$overlay_panel[k].bind('click', function(e){e.stopPropagation();}); // Stop children to propagate to parent
				}());
			}

			this.$overlay_panel[k].html(html);
		}

		this.clear_overlay = function (k){
			$('BODY').removeClass('noscroll');

			this.$($overlay_wrapper[k]).remove();
			delete this.$overlay_wrapper[k];

			this.$($overlay_panel[k]).remove();
			delete this.$overlay_panel[k];
		}
		
		return this;
	}

	// Initialize the object right away
	this.init();

	// Return object
	return this;
}
