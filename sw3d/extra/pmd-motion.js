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
	
	
	function bezierInterpolation(t, x1, y1, x2, y2) {
		var a = (1 + 3*x1 - 3*x2);
		var b = (3 * x2 - 6 * x1);
		var c = 3 * x1;
		var d = -t;
		
		var t2 = solveCubic(a, b, c, d);
		console.log(t2);
	}
	
	function solveCubic(a, b, c, d) {
		var _a3 = -1.0 / (3*a);
		var a2 = a*a;
		var b2 = b*b;
		var b3 = b2*b;
		
		console.log(Math.pow(2*b3 - 9*a*b*c + 27*a2*d, 2) - 4 * Math.pow(b2 - 3*a*c, 3))
		var A = Math.pow((2*b3 - 9*a*b*c + 27*a2*d + Math.sqrt( 
				Math.pow(2*b3 - 9*a*b*c + 27*a2*d, 2) - 4 * Math.pow(b2 - 3*a*c, 3)
			)
		) * 0.5, 1/3);

		var B = Math.pow((2*b3 - 9*a*b*c + 27*a2*d - Math.sqrt( 
				Math.pow(2*b3 - 9*a*b*c + 27*a2*d, 2) - 4 * Math.pow(b2 - 3*a*c, 3)
			)
		) * 0.5, 1/3);
		
		return b * _a3 + A * _a3 + B * _a3;
	}
	
	function bezier0to1(t, p2, p3) {
		var t2 = t*t;
		var t3 = t2 * t;

		var _t = (1.0 - t);
		var _t2 = _t * _t;
		
		return t3 + (3 * t2 * _t * p3) + (3 * t * _t2 * p2);
	}
	
	function testBezier() {
		function b(t, p1, p2) {
			return ((1 + 3 * p1 - 3 * p2) * t * t * t + (3 * p2 - 6 * p1) * t * t + 3 * p1 * t);
		}
		
		for (var i = 0;i < 10;i++) {
			console.log((b(i*0.1, 0.12, 0.47) - bezier0to1(i*0.1, 0.12, 0.47)).toFixed(9));
		}
	}
	
	bezierInterpolation(0.1, 0.1, 0.2, 0.9, 0.9);
	/*
	(function() {
		var x = solveCubic(-3, 6, 1, 1);
		console.log(x, (-3 * x*x*x + 6*x*x + 1*x + 1).toFixed(9))
	})();
	function TweenKeyFrame() {
		this.x = new TweenParams();
		this.y = new TweenParams();
		this.z = new TweenParams();
		this.r = new TweenParams();
	}
	
	
	TweenKeyFrame.prototype = {
		
	};
	*/

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
			var dupCount = 1;
			this.cache = this.allocateArray(len);
			for (var i = 0;i < len;++i) {
				var t = i / len;
				var x = bezier0to1(t, this.x1, this.x2);
				var xx = Math.floor(x*len);
				var t8 = Math.floor(t * 255)
				
				if (xx === prevPos) {
					++dupCount;
				} else {
					console.log(dupCount, prevPos)
					dupCount = 1;
				}
				console.log(xx, t8, xx - prevPos);
				prevPos = xx;
			}
			
			throw 1;
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
})(window.smallworld3d);