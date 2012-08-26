(function(){
	'use strict';

	function MotionManager(boneList, ikList) {
		var boneTree = new smallworld3d.PMDBoneTree();
		
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
		
		
		this.boneTree = boneTree;
		var IKTestPose = {
		  "左足":{"name":"左足","position":{"x":0,"y":0,"z":0},"rotationQuaternion":{"x":-0.03128201514482498,"y":-0.023980608209967613,"z":-0.27965670824050903,"w":0.9592905044555664}},
		  "左足ＩＫ":{"name":"左足ＩＫ","position":{"x":0.9543063640594482,"y":0.8959875106811523,"z":-0.15008078515529633},"rotationQuaternion":{"x":0,"y":0,"z":0,"w":1}},
		  "左肩":{"name":"左肩","position":{"x":0,"y":0,"z":0},"rotationQuaternion":{"x":0.6415807008743286,"y":-0.10379067063331604,"z":0.279940664768219,"w":0.7065660357475281}},
		  "首":{"name":"首","position":{"x":0,"y":0,"z":0},"rotationQuaternion":{"x":-0.0020507839508354664,"y":0.0041319564916193485,"z":0.029249079525470734,"w":0.9995618462562561}},
		  "右髪６":{"name":"右髪６","position":{"x":0,"y":0,"z":0},"rotationQuaternion":{"x":-0.012739654630422592,"y":0.025668064132332802,"z":0.18169787526130676,"w":0.9829370975494385}},
		};
		
		var testPose = new smallworld3d.PMDBoneTree.Pose();

		for (var bn in IKTestPose) {
			if (IKTestPose.hasOwnProperty(bn)) {
				var pos = IKTestPose[bn].position;
				var rq = IKTestPose[bn].rotationQuaternion;
				testPose.setBoneRotation(bn, rq.x, rq.y, rq.z, rq.w);
				testPose.setBonePosition(bn, pos.x, pos.y, pos.z);
			}
		}
		
		boneTree.setXAxisConstraint('\u3072\u3056');
		boneTree.updateRotation(testPose);
		boneTree.applyIK(testPose);
	};
	
	var vTmp = new smallworld3d.geometry.Vec4();
	var vTmp2 = new smallworld3d.geometry.Vec4();
	MotionManager.prototype = {
		prepareVertex: function(v, boneParams) {
			v.skinningMatrix = null;
			v.boneParams = null;
			if (boneParams) {
				var bp = new BoneParams(boneParams[0], boneParams[1], boneParams[2] * 0.01);
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
	
	function BoneParams(i1, i2, w1) {
		this.index1 = i1;
		this.index2 = i2;
		this.w1 = w1;
		this.w2 = 1.0 - w1;
		this.needsBlend = (w1 > 0.001 && w1 < 0.999);
	}
	
	window.MotionManager = MotionManager;
})();