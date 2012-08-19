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
				console.log("*", nd, parentNode)
			}
		}
	};
	
	PMDBoneTree.Node = function() {
		this.name = null;
		this.parentIndex = -1;
	}
	
	pkg.PMDBoneTree = PMDBoneTree;
})(window.smallworld3d);