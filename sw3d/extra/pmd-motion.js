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
				tweenParams: buildTweenParamsSet(tweenParams),
				rotationQuaternion: rotationQuaternion,
				positionOffset: positionOffset
			};
			
			console.log(this.tweenParamsMap[frameIndex][boneName].tweenParams)
			
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
					var frameLen = (fi - bi);
					var t = (frameIndex - bi) / frameLen;
					console.log("   t="+t)
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
	
	
	function bezier0to1(t, p2, p3) {
		var t2 = t*t;
		var t3 = t2 * t;

		var _t = (1.0 - t);
		var _t2 = _t * _t;
		
		return t3 + (3 * t2 * _t * p3) + (3 * t * _t2 * p2);
	}
	
	function TweenParams(x1, y1, x2, y2) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
		this.cache = null;
	}
	
	TweenParams.CACHE_LENGTH = 100;
	
	TweenParams.prototype = {
		createCache: function() {
			var len = TweenParams.CACHE_LENGTH;
			var prevPos = -1;
			var prevVal = 0;
			var dupCount = 1;
			var sum = 0;
			this.cache = this.allocateArray(len);
			
			for (var i = 0;i < len;++i) {
				var t = i / len;
				var x = bezier0to1(t, this.x1, this.x2);
				var xx = Math.floor(x*len);
				var y8 = Math.floor(bezier0to1(t, this.y1, this.y2) * 255)
				
				if (xx === prevPos) {
					++dupCount;
				} else {
					if (prevPos >= 0) {
						this.cache[prevPos] = sum / dupCount;
						prevVal = this.cache[prevPos];
						
						// X may be sparsed. Interpolate them.
						var interpolateLength = xx - prevPos;
						if (interpolateLength > 1) {
							for (var j = 1;j < interpolateLength;++j) {
								var alpha = j / interpolateLength;
								this.cache[prevPos + j] = prevVal*(1-alpha) + y8*alpha;
							}
						}
					}


					dupCount = 1;
					sum = 0;
				}
				prevPos = xx;
				sum += y8;
			}
			
			if (prevPos >= 0) {
				this.cache[prevPos] = sum / dupCount;
			}
			
		},
		
		allocateArray: function(length) {
			var a = null;

			// Try to allocate typed array
			try {
				a = new Uint8Array(length);
			} catch(e) {}

			// Fallback to standard array
			if (!a) {
				console.log("WARNING: This environment does not support TypedArray.");
				a = new Array(length);
				for (var i = 0;i < length;i++) { a[i] = 0; }
			}

			return a;
		},
		
		evaluateX: function(t) {
			return bezier0to1(t, this.x1, this.x2);
		},

		evaluateY: function(t) {
			return bezier0to1(t, this.y1, this.y2);
		},
		
		getYbyX: function(x) {
			var len = TweenParams.CACHE_LENGTH;
			var pos = Math.floor(x * len);
			var sub_t = (x*len) - pos;

			var nextPos = pos + 1;
			var nextVal;
			
			if (pos >= len) {return 1;}
			if (pos < 0) {return 0;}

			nextVal = (nextPos >= len) ? 255
			                           : this.cache[nextPos];
			
			return (this.cache[pos] * (1-sub_t) + nextVal * sub_t) / 255.0;
		}
	}
	
	function buildTweenParamsSet(tweenset) {
		var ret = {};
		
		for (var propName in tweenset) {
			if (tweenset.hasOwnProperty(propName)) {
				var src = tweenset[propName];
				ret[propName] = new TweenParams(src.x1, src.y1, src.x2, src.y2);
				ret[propName].createCache();
			}
		}
		
		return ret;
	}
	
	pkg.PMDMotion = PMDMotion;
	pkg.PMDMotion.TweenParams = TweenParams;
})(window.smallworld3d);