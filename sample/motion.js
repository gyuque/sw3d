(function(){
	function MotionManager(boneList) {
		var boneTree = new smallworld3d.PMDBoneTree();
		
		var len = boneList.length;
		for (var i = 0;i < len;i++) {
			var b = boneList[i];
			
			boneTree.addNode(b.name, b.pi, b.p[0], b.p[1], -b.p[2]);
		}
		
		boneTree.build();
		
		this.boneTree = boneTree;

		var testPose = new smallworld3d.PMDBoneTree.Pose();
		testPose.setBoneRotation("左肩", 0.000354,-0.109608, 0.078073, 0.990903);
		testPose.setBoneRotation("左腕",-0.178010, 0.037099,-0.119342, 0.976060);
		testPose.setBoneRotation("左ひじ",0.188023, 0.669247,-0.451050, 0.559740);
	};
	
	var vTmp = new smallworld3d.geometry.Vec4();
	var vTmp2 = new smallworld3d.geometry.Vec4();
	MotionManager.prototype = {
		drawDebugBones: function(renderingContext) {
			var vp = renderingContext.viewport;
			var ls = this.boneTree.list;
			var len = ls.length;
			for (var i = 0;i < len;i++) {
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
			}
		}
	};
	
	window.MotionManager = MotionManager;
})();