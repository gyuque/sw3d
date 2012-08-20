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
	};
	
	var vTmp = new smallworld3d.geometry.Vec4();
	MotionManager.prototype = {
		drawDebugBones: function(renderingContext) {
			var vp = renderingContext.viewport;
			var ls = this.boneTree.list;
			var len = ls.length;
			for (var i = 0;i < len;i++) {
				var nd = ls[i];
				if (nd.hasChild) {
					var pos = nd.position;
					renderingContext.combinedTransforms.worldViewProjection.transformVec3(vTmp, pos.x, pos.y, pos.z);
					vTmp.x /= vTmp.w;
					vTmp.y /= vTmp.w;
					
					var sx = vTmp.x * vp.scaleX + vp.centerX;
					var sy = vTmp.y * vp.scaleY + vp.centerY;
					renderingContext.rasterizer.setVertexAttribute(0,
						sx, sy, 0, 1,
						20, 255, 0, 0);

					renderingContext.rasterizer.setVertexAttribute(1,
						sx+1, sy, 0, 1,
						20, 255, 0, 0);

					renderingContext.rasterizer.setVertexAttribute(2,
						sx-1, sy, 0, 1,
						20, 255, 0, 0);

					renderingContext.rasterizer.plotPoints();
				}
			}
		}
	};
	
	window.MotionManager = MotionManager;
})();