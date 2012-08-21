(function(pkg) {
	'use strict';
	function PMDBoneTree() {
		this.list = [];
		this.nameMap = {};
	}
	
	PMDBoneTree.prototype = {
		addNode: function(name, parentIndex, x, y, z) {
			if (parentIndex > 32767) { parentIndex = -1; }
			var nd = new PMDBoneTree.Node();
			
			nd.name = name;
			nd.parentIndex = parentIndex;
			nd.position.x = x;
			nd.position.y = y;
			nd.position.z = z;
			
			this.list.push(nd);
			this.nameMap[name] = nd;
		},
		
		build: function() {
			var ls = this.list;
			var len = ls.length;
			
			for (var i = 0;i < len;i++) {
				var nd = ls[i];
				var parentNode = null;
				if (nd.parentIndex >= 0) {
					parentNode = ls[nd.parentIndex] || null;
				}
				
				if (parentNode) {
					parentNode.children.push(nd);
					parentNode.hasChild = true;
					nd.parent = parentNode;
				}
				// console.log("*", nd, parentNode)
			}
		}
	};


	PMDBoneTree.Pose = function() {
		this.nameMap = {};
	};
	
	PMDBoneTree.Pose.prototype = {
		setBoneRotation: function(boneName, qx, qy, qz, qw) {
			this.nameMap[boneName] = new smallworld3d.geometry.Quaternion(qx, qy, qz, qw);
		}
	};
	
	
	PMDBoneTree.Node = function() {
		this.name = null;
		this.position = new smallworld3d.geometry.Vec4();
		this.parentIndex = -1;
		this.children = [];
		this.hasChild = false;
		this.parent = null;
		this.currentPostureMatrix = new smallworld3d.geometry.M44();
	}
	
	pkg.PMDBoneTree = PMDBoneTree;
})(window.smallworld3d);