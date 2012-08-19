(function(){
	function MotionManager(boneList) {
		var boneTree = new smallworld3d.PMDBoneTree();
		
		var len = boneList.length;
		for (var i = 0;i < len;i++) {
			var b = boneList[i];
			
			boneTree.addNode(b.name, b.pi, b.p[0], b.p[1], b.p[2]);
		}
		
		boneTree.build();
	};
		
	MotionManager.prototype = {
		
	};
	
	window.MotionManager = MotionManager;
})();