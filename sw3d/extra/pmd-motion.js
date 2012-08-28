(function(pkg) {
	'use strict';

	function PMDMotion() {
		this.tweenParamsMap = {};
		
		this.maxIndex = 0;
		this.boneNameMap = {};
	}
	
	PMDMotion.prototype = {
		addPose: function(frameIndex, boneName, positionOffset, rotationQuaternion, tweenParams) {
			// Save registered bone name
			this.boneNameMap[boneName] = new ForeignKeyframeMap();;
			
			if (!this.tweenParamsMap[frameIndex]) {
				this.tweenParamsMap[frameIndex] = {};
			}

			this.tweenParamsMap[frameIndex][boneName] = {
				tweenParams: tweenParams,
				rotationQuaternion: rotationQuaternion,
				positionOffset: positionOffset
			};
			
			if (this.maxIndex < frameIndex) {
				this.maxIndex = frameIndex;
			}
		},
		
		calcFrame: function(frameIndex) {
			for (var bn in this.boneNameMap) {
				this.calcFrameOfBone(frameIndex, bn);
			}
		},
		
		calcFrameOfBone: function(frameIndex, boneName) {
			var boneMap = this.tweenParamsMap[frameIndex] || null;
			var boneParams = null;
			if (boneMap) { boneParams = boneMap[boneName]; }
			
			if (boneParams) { // Keyframe
				console.log(frameIndex, boneName, boneParams);
			} else {
				var foreignMap = this.boneNameMap[boneName];
				var bi = foreignMap.getBackwardKeyframe(frameIndex);
				var fi = foreignMap.getForwardKeyframe(frameIndex);
				if (fi < 0) {
					// After last frame
					console.log("TF", boneName, bi +" <<- "+ frameIndex);
				} else {
					// Mid frame
					console.log("TF", boneName, bi +" <-> "+ frameIndex + " <-> " + fi);
				}
			}
		},
		
		buildIndex: function() {
			for (var bn in this.boneNameMap) {
				this.buildIndexOfBone(bn);
			}
		},
		
		buildIndexOfBone: function(boneName) {
			var maps = this.boneNameMap[boneName];
			
			var prevKF = -1;
			var i;
			
			// Make backward keyframe lookup table
			for (i = 0;i <= this.maxIndex;++i) {
				maps.backMap[i] = prevKF;
				
				if (this.tweenParamsMap[i] && this.tweenParamsMap[i][boneName]) {
					prevKF = i;
				}
			}
			
			// Make forward keyframe lookup table
			var fwdKF = -1;
			for (i = this.maxIndex;i >= 0;--i) {
				maps.fwdMap[i] = fwdKF;
				
				if (this.tweenParamsMap[i] && this.tweenParamsMap[i][boneName]) {
					fwdKF = i;
				}
			}
		}
	};
	
	function ForeignKeyframeMap() {
		this.backMap = {};
		this.fwdMap = {};
	}
	
	ForeignKeyframeMap.prototype = {
		getBackwardKeyframe: function(frameIndex) {
			if (!this.backMap.hasOwnProperty(frameIndex)) {
				return -1;
			}
			
			return this.backMap[frameIndex];
		},
		
		getForwardKeyframe: function(frameIndex) {
			if (!this.fwdMap.hasOwnProperty(frameIndex)) {
				return -1;
			}
			
			return this.fwdMap[frameIndex];
		}
	}
	
	/*
	function TweenKeyFrame() {
		this.x = new TweenParams();
		this.y = new TweenParams();
		this.z = new TweenParams();
		this.r = new TweenParams();
	}
	
	function TweenParams(x1, y1, x2, y2) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}
	
	TweenKeyFrame.prototype = {
		
	};
	*/
	pkg.PMDMotion = PMDMotion;
})(window.smallworld3d);