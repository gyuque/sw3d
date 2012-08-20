(function(pkg) {
	'use strict';
	function PMDBoneTree() {
		this.list = [];
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
				}
				console.log("*", nd, parentNode)
			}
		}
	};
	
	PMDBoneTree.Node = function() {
		this.name = null;
		this.position = new smallworld3d.geometry.Vec4();
		this.parentIndex = -1;
		this.children = [];
		this.hasChild = false;
	}
	
	pkg.PMDBoneTree = PMDBoneTree;
})(window.smallworld3d);