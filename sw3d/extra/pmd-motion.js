(function(pkg) {
	'use strict';

	function PMDMotion() {
		this.poseKeyFrameMap = {};
		this.tweenParamsMap = {};
		
		this.maxIndex = 0;
		this.boneNameMap = {};
	}
	
	PMDMotion.prototype = {
		addPose: function(frameIndex, boneName, positionOffset, rotationQuaternion, tweenParams) {
			// Save registered bone name
			this.boneNameMap[boneName] = new ForeignKeyframeMap();;
			
			if (!this.poseKeyFrameMap[frameIndex]) {
				this.poseKeyFrameMap[frameIndex] = new smallworld3d.PMDBoneTree.Pose();
			}

			if (!this.tweenParamsMap[frameIndex]) {
				this.tweenParamsMap[frameIndex] = {};
			}

			var pose = this.poseKeyFrameMap[frameIndex];
			pose.setBoneRotation(boneName, rotationQuaternion.x, rotationQuaternion.y, rotationQuaternion.z, rotationQuaternion.w);
			pose.setBonePosition(boneName, positionOffset.x, positionOffset.y, positionOffset.z);

			this.tweenParamsMap[frameIndex][boneName] = tweenParams;
			if (this.maxIndex < frameIndex) {
				this.maxIndex = frameIndex;
			}
		},
		
		buildIndex: function() {
			for (var bn in this.boneNameMap) {
				this.buildIndexOfBone(bn);
			}
			console.log(this.boneNameMap);
			/*
			var prevKF = 0;
			for (var i = 0;i < this.maxIndex;++i) {
				this.backKeyframeMap[i] = prevKF;
				if (this.poseKeyFrameMap[i]) {
					prevKF = i;
				}
			}
			
			console.log();
			*/
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