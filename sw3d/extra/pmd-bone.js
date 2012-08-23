(function(pkg) {
	'use strict';
	function PMDBoneTree() {
		this.list = [];
		this.nameMap = {};
		this.root = null;
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
			
			if (parentIndex < 0 && !this.root) {
				this.root = nd;
			}
			
			nd.index = this.list.length;
			this.list.push(nd);
			this.nameMap[name] = nd;
		},
		
		getIndexOfName: function(name) {
			var nd = this.nameMap[name];
			return nd ? nd.index : -1;
		},
		
		getByIndex: function(index) {
			return this.list[index] || null;
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
		},
		
		updateRotation: function(pose) {
			this.setRotationAroundBone(pose, this.root, null);
			this.updateChildrenRotation(pose, this.root.children, this.root);
		},
		
		updateChildrenRotation: function(pose, childList, parentNode) {
			var len = childList.length;
			for (var i = 0;i < len;i++) {
				var childNode = childList[i];
				this.setRotationAroundBone(pose, childNode, parentNode);

				this.updateChildrenRotation(pose, childNode.children, childNode);
			}
		},
		
		setRotationAroundBone: function(pose, node, parentNode) {
			var q = pose.getRotationQuaternion(node.name);
			if (q) {
				q.generateRotationMatrix(node.localPostureMatrix);
			} else {
				node.localPostureMatrix.ident();
			}

			var counterOffset = tempM1.translate(-node.position.x, -node.position.y, -node.position.z);
			tempM2.mul(node.localPostureMatrix, counterOffset);

			var resumeOffset = tempM1.translate(node.position.x, node.position.y, node.position.z);
			tempM3.mul(resumeOffset, tempM2);
			
			if (parentNode) {
				// second, cumulative transform <- first, local rotation
				node.cumulativeMatrix.mul(parentNode.cumulativeMatrix, tempM3);
			} else {
				node.cumulativeMatrix.copyFrom(tempM3);
			}
		}
	};


	PMDBoneTree.Pose = function() {
		this.nameMap = {};
		this.convertDirectX = true;
	};
	
	PMDBoneTree.Pose.prototype = {
		setBoneRotation: function(boneName, qx, qy, qz, qw) {
			if (this.convertDirectX) {
				this.nameMap[boneName] = new smallworld3d.geometry.Quaternion(-qx, -qy, qz, qw);
			} else {
				this.nameMap[boneName] = new smallworld3d.geometry.Quaternion(qx, qy, qz, qw);
			}
		},
		
		getRotationQuaternion: function(boneName) {
			return this.nameMap[boneName] || null;
		}
	};
	
	
	PMDBoneTree.Node = function() {
		this.name = null;
		this.position = new smallworld3d.geometry.Vec4();
		this.parentIndex = -1;
		this.children = [];
		this.hasChild = false;
		this.parent = null;
		this.localPostureMatrix = new smallworld3d.geometry.M44();
		this.cumulativeMatrix = new smallworld3d.geometry.M44();
		this.index = 0;
	}
	
	var tempM1 = new smallworld3d.geometry.M44();
	var tempM2 = new smallworld3d.geometry.M44();
	var tempM3 = new smallworld3d.geometry.M44();
	
	pkg.PMDBoneTree = PMDBoneTree;
})(window.smallworld3d);