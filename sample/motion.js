(function(){
	'use strict';
	var tempPose = null;

	function MotionManager(boneList, ikList) {
		var boneTree = new smallworld3d.PMDBoneTree();
		this.nowPlaying = false;
		this.showingFrame = -1;
		this.startTime = 0;
		this.renderer = null;
		
		// Build bone tree
		var i;
		var len = boneList.length;
		for (i = 0;i < len;i++) {
			var b = boneList[i];
			boneTree.addNode(b.name, b.pi, b.p[0], b.p[1], -b.p[2]);
		}
		boneTree.build();
		
		// Register IK bones
		if (ikList) {
			var ikLen = ikList.length;
			for (i = 0;i < ikLen;i++) {
				var ik = ikList[i];
				boneTree.registerIKBone(ik);
			}
		}

		boneTree.setXAxisConstraint('\u3072\u3056');
		this.boneTree = boneTree;

		tempPose = new smallworld3d.PMDBoneTree.Pose();
		this.buildMotion(SAMPLE_MOTION);
	};
	
	var vTmp = new smallworld3d.geometry.Vec4();
	var vTmp2 = new smallworld3d.geometry.Vec4();
	MotionManager.prototype = {
		observeInputEvent: function(target) {
			var _this = this;
			target.addEventListener("click", function() {
				if (!_this.nowPlaying) {
					_this.play();
				}
			}, false);
		},
		
		play: function() {
			this.showingFrame = -1;
			this.startTime = (new Date()) - 0;
			this.showFrame();
		},
		
		showFrame: function() {
			var et = (new Date()) - this.startTime;
			var frameIndexToShow = Math.floor(et / 15);
			
			if (frameIndexToShow != this.showingFrame) {
				this.showingFrame = frameIndexToShow;
				
				this.showPoseOfFrame(frameIndexToShow);
				
				if (this.renderer) {
					this.renderer.render();
				}
			}
			
			this.nowPlaying = (frameIndexToShow < 40);
			this.callNextFrame();
		},
		
		showPoseOfFrame: function(frameIndex) {
			this.pmdMotion.calcFrame(tempPose, frameIndex);
			this.boneTree.updateRotation(tempPose);
			this.boneTree.applyIK(tempPose);
		},
		
		callNextFrame: function() {
			var _this = this;
			if (this.nowPlaying) {
				setTimeout(function() {
					_this.showFrame();
				}, 1);
			}
		},
		
		buildMotion: function(src) {
			this.pmdMotion = new smallworld3d.PMDMotion();
			
			var frameCount = src.length;
			for (var fi = 0;fi < frameCount;++fi) {
				var frame = src[fi];
				for (var bname in frame.bones) {
					var pose = frame.bones[bname];
					this.pmdMotion.addPose(frame.frameIndex, bname, pose.position, pose.rotationQuaternion, pose.tween);
				}
			}
			
			this.pmdMotion.buildIndex();
		},
		
		prepareVertex: function(v, boneParams) {
			v.skinningMatrix = null;
			v.boneParams = null;
			if (boneParams) {
				var bp = new smallworld3d.BoneParams(boneParams[0], boneParams[1], boneParams[2] * 0.01);
				if (bp.needsBlend) {
					v.skinningMatrix = new smallworld3d.geometry.M44();
				}
				
				v.boneParams = bp;
			}
		},
		
		updateVertices: function(vertexList) {
			var len = vertexList.length;
			for (var i = 0;i < len;++i) {
				var v = vertexList[i];
				if (v.boneParams) {
					var m1 = this.boneTree.getByIndex(v.boneParams.index1).cumulativeMatrix;
					var m2 = this.boneTree.getByIndex(v.boneParams.index2).cumulativeMatrix;
					
					if (v.boneParams.needsBlend) {
						v.skinningMatrix.blend(m1, m2, v.boneParams.w1);
					} else {
						v.skinningMatrix = (v.boneParams.w1 > 0.5) ? m1 : m2;
					}
				}
			}
		},
		
		drawDebugBones: function(renderingContext) {
			var vp = renderingContext.viewport;
			var ls = this.boneTree.list;
			var len = ls.length;
			for (var i = 0;i < len;i++) {
				var pos = this.boneTree.DEBUGPOS;
				if (!pos) break;
				
				renderingContext.combinedTransforms.worldViewProjection.transformVec3(vTmp, pos.x, pos.y, pos.z);
				vTmp.x /= vTmp.w;
				vTmp.y /= vTmp.w;
				var sx = vTmp.x * vp.scaleX + vp.centerX;
				var sy = vTmp.y * vp.scaleY + vp.centerY;
				renderingContext.rasterizer.setVertexAttribute(0,
					sx, sy, 0, 1,
					0, 255, 0, 0);
				renderingContext.rasterizer.setVertexAttribute(1,
					sx+1, sy, 0, 1,
					0, 255, 0, 0);
				renderingContext.rasterizer.setVertexAttribute(2,
					sx-1, sy, 0, 1,
					0, 255, 0, 0);


				renderingContext.rasterizer.plotPoints();

				/*
				var nd = ls[i];
				if (nd.parent) {
					var pos = nd.position;
					renderingContext.combinedTransforms.worldViewProjection.transformVec3(vTmp, pos.x, pos.y, pos.z);
					vTmp.x /= vTmp.w;
					vTmp.y /= vTmp.w;

					var pos2 = nd.parent.position;
					renderingContext.combinedTransforms.worldViewProjection.transformVec3(vTmp2, pos2.x, pos2.y, pos2.z);
					vTmp2.x /= vTmp2.w;
					vTmp2.y /= vTmp2.w;
					
					var sx = vTmp.x * vp.scaleX + vp.centerX;
					var sy = vTmp.y * vp.scaleY + vp.centerY;

					var sx2 = vTmp2.x * vp.scaleX + vp.centerX;
					var sy2 = vTmp2.y * vp.scaleY + vp.centerY;
					renderingContext.rasterizer.setVertexAttribute(0,
						sx, sy, 0, 1,
						0, 255, 0, 0);

					renderingContext.rasterizer.setVertexAttribute(1,
						sx2*0.1 + sx*0.9, sy2*0.1 + sy*0.9, 0, 1,
						0, 200, 100, 0);

					renderingContext.rasterizer.setVertexAttribute(2,
						sx2*0.2 + sx*0.8, sy2*0.2 + sy*0.8, 0, 1,
						220, 155, 200, 0);

					renderingContext.rasterizer.plotPoints();
				}
				*/
			}
		}
	};
		
	window.MotionManager = MotionManager;
})();