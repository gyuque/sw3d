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
			this.boneNameMap[boneName] = true;
			
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
			var prevKF = 0;
			for (var i = 0;i <= this.maxIndex;++i) {
				if (this.tweenParamsMap[i] && this.tweenParamsMap[i][boneName]) {
					prevKF = i;
					console.log(boneName, i)
				}
			}
			
		}
	};
		
	pkg.PMDMotion = PMDMotion;
})(window.smallworld3d);