import videojs from "video.js";

var onPlayerMarker = (options, player) => {
	var defaults = {
		src : '', //Advertisement source, can also be an object like {src:"file.mp4",type:"video/mp4"}
		href : '', //Advertised url
		target: '_blank', //Target to open the ad url in
		allowSkip: true, //Allow skipping of the ad after a certain period
		skipTime: 5, //Seconds after which the ad can be skipped
		repeatAd: false, //Show the ad only once or after every conten
		adSign: false, //Advertisement sign
		showRemaining: false, //Show remaining ad time > works if allowSkip is false
		adsOptions: {}, //Options passed to the ads plugin
		lang: {
		  'skip':'Skip Ad',
		  'skip in': 'Skip in ',
		  'advertisement': 'Advertisement',
		  'video start in': 'Video will start in: '
		} //Language entries for translation
	  };
	
	  //
	  // Initialize the plugin.
	  //
	  // @param options
	  //            (optional) {object} configuration for the plugin
	  //
	var settings = videojs.mergeOptions(defaults, options);
	player.preroll = {adDone:false};
	player.on('contentupdate', function() {
		if(!player.preroll.shouldPlayPreroll()){
			player.trigger('adscanceled');
		}else{
			player.trigger('adsready');
		}
	});
	player.on('readyforpreroll', function() {
		// No video? No ad.
		if(!player.preroll.shouldPlayPreroll()){
			player.trigger('adscanceled');
			return;
		}

		// Initialize ad mode
		player.ads.startLinearAdMode();

		// Change player src to ad src
		player.src(settings.src);
		player.one('durationchange', function() {
			player.play();
		});

		//Fallback in case preload = none
		player.one('progress', function() {
			player.play();
		});
		player.one('adloadstart',function(){
			player.play();
		});

		if(settings.href !== ''){
			// link overlay
			player.preroll.blocker.href = settings.href;
			player.preroll.blocker.target = settings.target || '_blank';
			player.preroll.blocker.onclick = function() {
				player.trigger('adclick');
			};
			var blocker = player.preroll.blocker;
			player.el().insertBefore(blocker, player.controlBar.el());
		}

		if(settings.adSign !== false){
			var adBox = player.preroll.adBox = adBox;
			player.preroll.adBox.innerHTML = settings.lang.advertisement;
		}

		if(settings.showRemaining !== false && settings.allowSkip === false){
			player.preroll.remainingTime.innerHTML = settings.lang['video start in'];
			player.on('adtimeupdate', player.preroll.timeremaining);
		}

		if (settings.allowSkip !== false){
		var skipButton = player.preroll.skipButton;

		skipButton.onclick = function(e) {
			var Event = window.Event;
			if((' ' + player.preroll.skipButton.className + ' ').indexOf(' enabled ') >= 0) {
				player.preroll.exitPreroll();
			}
			if(Event.prototype.stopPropagation !== undefined) {
				e.stopPropagation();
			} else {
				return false;
			}
		};
			player.on('adtimeupdate', player.preroll.timeupdate);
		}
		player.one('adended', player.preroll.exitPreroll);
		player.one('error', player.preroll.prerollError);
	});
	player.preroll.shouldPlayPreroll = function(){
		if (settings.src === ''){
		return false;
		}
		if (player.preroll.adDone === true){
		return false;
		}
		return true;
	};
	player.preroll.exitPreroll = function() {
		if(typeof player.preroll.skipButton !== 'undefined'){
			player.preroll.skipButton.parentNode.removeChild(player.preroll.skipButton);
		}
		if(typeof player.preroll.adBox !== 'undefined'){
			player.preroll.adBox.parentNode.removeChild(player.preroll.adBox);
		}
		if(typeof player.preroll.remainingTime !== 'undefined'){
			player.preroll.remainingTime.parentNode.removeChild(player.preroll.remainingTime);
		}
		if(typeof player.preroll.blocker !== 'undefined'){
			player.preroll.blocker.parentNode.removeChild(player.preroll.blocker);
		}
		//player.off('timeupdate', player.preroll.timeupdate);
		player.off('adended', player.preroll.exitPreroll);
		player.off('error', player.preroll.prerollError);
		if (settings.repeatAd !== true){
			player.preroll.adDone=true;
		}
		player.loadingSpinner.show(); //Show Spinner to provide feedback of video loading status to user
		player.posterImage.hide(); //Hide Poster Image to provide feedback of video loading status to user
		player.bigPlayButton.hide(); //Hide Play Button to provide feedback of video loading status to user
		player.play();
		player.ads.endLinearAdMode();
	};
	player.preroll.timeupdate = function(e) {
		player.loadingSpinner.hide();
		var timeLeft = Math.ceil(settings.skipTime - player.currentTime());
		if(timeLeft > 0) {
			player.preroll.skipButton.innerHTML = settings.lang['skip in'] + timeLeft + '...';
		} else {
		if((' ' + player.preroll.skipButton.className + ' ').indexOf(' enabled ') === -1){
			player.preroll.skipButton.className += ' enabled';
			player.preroll.skipButton.innerHTML = settings.lang.skip;
		}
		}
	};
	player.preroll.timeremaining = function(e) {
		player.loadingSpinner.hide();
		var timeLeft = Math.ceil(player.remainingTime());
		if(timeLeft > 0) {
			player.preroll.remainingTime.innerHTML = settings.lang['video start in'] + timeLeft;
		}
	};
	player.preroll.prerollError = function(e){
		player.preroll.exitPreroll();
	};
	if (player.currentSrc()) {
		if(player.preroll.shouldPlayPreroll()){
			player.trigger('adsready');
		}else{
			player.trigger('adscanceled');
		}
	}
}

export default onPlayerMarker;