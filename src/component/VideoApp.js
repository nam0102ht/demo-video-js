import { Component } from "react";

import React from "react";
import videojs from "video.js";
import "videojs-contrib-ads/dist/videojs.ads.css";
import "video.js/dist/video-js.css";
import "./videojs.css";
import "videojs-overlay/dist/videojs-overlay";
import "videojs-overlay/dist/videojs-overlay.css";
import 'videojs-markers/dist/videojs-markers';
import "videojs-markers/dist/videojs.markers.css";
import "videojs-ima";
import "videojs-hotkeys";
import "./shared/preroll/video-preproll.css";
import "./shared/preroll/video-preproll";
import "videojs-mobile-ui";
import "videojs-event-tracking";
import "videojs-pip";
import sstf from "../utils/sstf.js";
import onPlayerMarker from "./shared/preroll/video-preproll.fn";
import * as _ from "lodash";
const en = require("./vtt/en.vtt");
const vn = require("./vtt/vn.vtt");

window.videojs = videojs;
window.HELP_IMPROVE_VIDEOJS = false;
export default class VideoApp extends Component {
	constructor(props) {
		super(props);
		this.videoRef = React.createRef();
		this.state = {
			player: null,
			isPlaying: false,
			previousTime: 0,
			currentTimeWatch: 0,
			seekingTime: 0,
			totalSeeking: 0,
			totalWatch: 0,
			seek: []
		}
	}
	
	componentWillUnmount() {
		if(this.state.player){
			this.state.player.dispose();
		}
	}

	componentDidMount() {
		window.addEventListener("beforeunload", this.onUnloadBeforePage);
		window.addEventListener("unload", this.onUnloadPage);
		this.setState({
			totalSeeking: 0
		})
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
				playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
				pipButton: {},
				plugins: { eventTracking: true },
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
					player.playsinline(true)
					// apply autoplay & loop option
					player.autoplay(true);
					player.loop(false);
					// apply show controls option
					player.controlBar.show();
					// apply start muted option
					// muting when autoplay & loop since it won't autoplay unmuted if the user hasn't interacted with the page
					player.muted(true);

					player.preroll({
						allowSkip: true,
						src: "http://www.lottecinemavn.com/Media/MovieFile/MovieMedia/202006/10514_301_100001.mp4",
						href: "https://google.com"
					});

					player.markers({
						breakOverlay:{
							display: true
						},
						markerTip: {
							display: false,
							text: function(marker) {
								return "Aadvertisement: " + marker.text;
							  },
							time: function(marker) {
								if(marker)
									return marker.time;
							}
						},
						onMarkerReached: function(marker, index) {
							onPlayerMarker({
								src: marker.ad,
								href: "https://google.com"
							}, player);
							player.markers.remove([index]);
						},
						markers: [
						   {time: 30, ad: "http://www.lottecinemavn.com/Media/MovieFile/MovieMedia/202006/10514_301_100001.mp4"},
						]
					});		
				}
			}
		);
		
		this.setState({
			player: player,
			isPlaying: !this.state.isPlaying
		});
		player.ready(function() {
			this.hotkeys({
				volumeStep: 0.1,
				fullscreenKey: function(event, player) {
					switch(event.which){
						case 32:
							player.paused ? player.play() : player.pause();
							break;
						case 73:{
							if (player.requestPictureInPicture) { // feature detection to stop errors in unsupported browsers
								if (document.pictureInPictureElement) {
									document.exitPictureInPicture();
								} else {
									player.requestPictureInPicture();
								}
							}
							break;
						}
						default: return;
					}
				}
			});
		});
		player.on("error", this.onPlayerError);
		player.on("pause", this.onPlayerPause);
		player.on("ended", this.onPlayerEnd);
		player.on("timeupdate", this.onPlayerUpdateTime);
		player.on('tracking:seek', this.onPlayerSeek);
		player.on("tracking:performance", (e, data) => {
			console.log(data)
		});
		let video = player.el().firstElementChild;
		const autopip = document.createAttribute("autopictureinpicture");
		video.setAttributeNode(autopip);
		function entervideopip(player) {
			if(document.pictureInPictureEnabled && !video.disablePictureInPicture) {
				try {
					if (document.pictureInPictureElement) {
						document.exitPictureInPicture();
					}
		
					video.requestPictureInPicture();
				} catch(err) {
					console.error(err);
				}
			}
		}
		video.onloadedmetadata = function() {
			entervideopip(player);
		}
	}

	onUnloadBeforePage = (event) => {
		console.log(this.state.totalWatch);
	}

	onUnloadPage = (event) => {
		console.log(this.state.totalWatch);
	}

	onPlayerError = () => {
		this.state.player.error();
	}

	onPlayerPause = () => {
		this.state.player.paused();
		if(this.state.totalSeeking === 0) {
			this.setState({
				totalWatch: Math.floor(this.state.currentTimeWatch)
			})
		} else {
			let totalWatch = Math.floor(Math.floor(this.state.player.duration()) - this.state.totalSeeking);
			this.setState({
				totalWatch: totalWatch
			});
		}
	}

	onPlayerEnd  = () => {
		if(this.state.totalSeeking === 0) {
			this.setState({
				totalWatch: Math.floor(this.state.currentTimeWatch)
			})
		} else {
			let totalWatch = Math.floor(Math.floor(this.state.player.duration()) - this.state.totalSeeking);
			this.setState({
				totalWatch: totalWatch
			});
		}
	}

	onPlayerSeek = (e, data) => {
		var options = _.extend({}, data, {seekStart: Math.floor(this.state.previousTime)}, {totalSeek: Math.abs(Math.floor(data.seekTo - this.state.previousTime))});
		this.state.seek.push(options);
		var totalSeeking = this.state.totalSeeking;
		var totalWatch = this.state.totalWatch;

		var arrTimeSeek = this.state.seek.map(value => {
			return value.seekTo
		})

		var totalSeek = sstf(options.seekStart, arrTimeSeek);

		for(let i=0; i<totalSeek.length-1;i++){
			totalSeeking = Math.abs(totalSeek[i] - totalSeek[i+1]);
		}
		let MaxSeek = 0;
		for(let i=0; i<arrTimeSeek.length;i++){
			if(arrTimeSeek[i] > MaxSeek){
				MaxSeek = arrTimeSeek[i];
			}
		}
		if(this.state.currentTimeWatch < Math.floor(this.state.player.duration())){
			totalWatch =  Math.floor(MaxSeek - totalSeeking);
		}
		else {
			totalWatch = Math.floor(Math.floor(this.state.player.duration()) - totalSeeking);
		}
		this.setState({
			totalSeeking : totalSeeking,
			totalWatch: totalWatch
		});
	}

	onPlayerUpdateTime = () => {
		if(this.state.player.preroll.adDone) {
			this.setState({
				previousTime: this.state.currentTimeWatch,
				currentTimeWatch: this.state.player.currentTime()
			});
		}
	}


	onClickButton =  async () => {
		if(document.pictureInPictureEnabled){
			await this.state.player.requestPictureInPicture();
		}
	}
	onClickButtonUnClick = async () => {
		if(document.pictureInPictureEnabled) {
			await document.exitPictureInPicture();
		}
	}

	render() {
		return (
			<div className="demo-wrapper-video">
				<div 
					ref={this.videoRef}
					className="video-js"
				>
				</div>
				<button 
					id="button1"
					onClick={this.onClickButton}
				>PiP</button>
				<button 
					id="button2"
					onClick={this.onClickButtonUnClick}
				>UnPiP</button>
				<video></video>
				<div className="content">
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
					<p className="the-article-tags"><i className="znews-ic-tag-1"></i>
		
						<strong className="tag-item">tàu sân bay Mỹ thách thức Trung Quốc ở Biển Đông</strong>
						
						
						<a href="/tieu-diem/tong-thong-my-donald-trump.html" title="Donald Trump" className="tag-item">Donald Trump</a>
						
						<a href="/tieu-diem/trung-quoc.html" title="Trung Quốc" className="tag-item">Trung Quốc</a>
						
						<a href="/tieu-diem/han-quoc.html" title="Hàn Quốc" className="tag-item">Hàn Quốc</a>
						
						<a href="/tieu-diem/hop-chung-quoc-hoa-ky.html" title="Mỹ" className="tag-item">Mỹ</a>
						
						<a href="/tieu-diem/philippines.html" title="Philippines" className="tag-item">Philippines</a>
						
						<a href="/tieu-diem/australia-uc.html" title="Australia" className="tag-item">Australia</a>
						
						<a href="/tieu-diem/tau-san-bay.html" title="Tàu sân bay" className="tag-item">Tàu sân bay</a>
						
						<a href="/tieu-diem/trung-dong.html" title="Trung Đông" className="tag-item">Trung Đông</a>
						
						<a href="/tieu-diem/duc.html" title="Đức" className="tag-item">Đức</a>
						
						
						
						<span className="tag-item">USS Ronald Reagan</span>
						
						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>

						<span className="tag-item">USS Nimitz</span>
						
						<span className="tag-item">Trung Quốc</span>
						
					<span className="more-icon" title="Xem thêm"><i className="ti-plus"></i></span></p>
				</div>
			</div>
		)
	}
}