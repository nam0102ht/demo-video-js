import { Component } from "react";

import React from "react";
import videojs from "video.js";
import * as contrib from "videojs-contrib-ads";
import "videojs-contrib-ads/dist/videojs.ads.css";
import "video.js/dist/video-js.css";
import "./videojs.css";
import "videojs-overlay/dist/videojs-overlay";
import "videojs-overlay/dist/videojs-overlay.css";
import "videojs-markers/dist/videojs-markers.js";
import "videojs-markers/dist/videojs.markers.css";
import "videojs-ima"
const en = require("./vtt/en.vtt");
const vn = require("./vtt/vn.vtt");

videojs.registerPlugin("ads", contrib.default);
export default class VideoApp extends Component {
	constructor(props) {
		super(props);
		this.videoRef = React.createRef();
	}

	state = {
		player: null,
		isPlaying: false,
	}
	
	componentWillUnmount() {
		if(this.state.player){
			this.state.player.dispose();
		}
	}

	componentDidMount() {
		const player = videojs(this.videoRef.current,
			{
				html5: {
					nativeTextTracks: false,
					nativeControlsForTouch: true
				},
				tracks: [
					{
						kind: "captions", 
						src: en, 
						srclang: "en", 
						label: "english"
					},
					{
						kind: "captions", 
						src: vn, 
						srclang: "vn", 
						label: "vietnamese"
					},
				], 
				textTrackSettings: true,
				fluid: true,
				playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
			},
			function() {
				var player = this;

				if(player) {
					// reset player to stop current video, if applicable
					player.reset();
					// load video and apply options
					player.responsive(true);
					player.src("http://www.lottecinemavn.com/Media/MovieFile/MovieMedia/202006/10517_301_100001.mp4");
					player.controls(true);
					// apply autoplay & loop option
					player.autoplay(true);
					player.loop(false);
					// apply show controls option
					player.controlBar.show();
					// apply start muted option
					// muting when autoplay & loop since it won't autoplay unmuted if the user hasn't interacted with the page
					player.muted(true);

					// player.markers({
					// 	markers: [
					// 	   {time: 1, ad: "http://www.lottecinemavn.com/Media/MovieFile/MovieMedia/202006/10514_301_100001.mp4"},
					// 	   {time: 16,  ad: "http://www.lottecinemavn.com/Media/MovieFile/MovieMedia/202006/10514_301_100001.mp4"},
					// 	   {time: 29,ad: "http://www.lottecinemavn.com/Media/MovieFile/MovieMedia/202006/10514_301_100001.mp4"},
					// 	   {time: 40,  ad: "http://www.lottecinemavn.com/Media/MovieFile/MovieMedia/202006/10514_301_100001.mp4"}
					// 	],
					// 	onMarkerReached: function(marker) {
					// 		// request ads whenever there's new video content
					// 		player.on('contentchanged', function() {
					// 			// in a real plugin, you might fetch new ad inventory here
					// 			player.trigger('adsready');
					// 		});
							
					// 		player.on('readyforpreroll', function() {
					// 			player.ads.startLinearAdMode();
					// 			player.ads.disableNextSnapshotRestore = true;
					// 			// play linear ad content
					// 			player.src(marker.ad);
							
					// 			// send event when ad is playing to remove loading spinner
					// 			player.one('adplaying', function() {
					// 				player.trigger('ads-ad-started');
					// 			});

					// 			player.one('adskip', function() {
					// 				player.ads.skipLinearAdMode();
					// 			});
							
					// 			// resume content when all your linear ads have finished
					// 			player.one('adended', function() {
					// 				player.ads.endLinearAdMode();
					// 			});
					// 		});
							
					// 		player.trigger('adsready');
					// 	},
					// });
				}
			}
		);
		player.ima({
			adTagUrl: "http://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=xml_vmap1&unviewed_position_start=1&cust_params=sample_ar%3Dpremidpostpod%26deployment%3Dgmf-js&cmsid=496&vid=short_onecue&correlator="
		});
		this.setState({
			player: player,
			isPlaying: !this.state.isPlaying
		});
		player.on("error", this.onPlayerError);
		player.on("pause", this.onPlayerPause);
		player.on("playing", this.onPlayerPlaying);
	}

	onPlayerError = () => {
		this.state.player.error();
	}

	onPlayerPause = () => {
		this.state.player.paused();
	}

	onPlayerPlaying = () => {
	}

	render() {
		return (
			<div className="demo-wrapper-video">
				<div 
				    ref={this.videoRef}
					className="video-js"
				>
				</div>
			</div>
		)
	}
}