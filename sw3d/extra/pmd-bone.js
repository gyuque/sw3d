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

				tempM2.translate(node.position.x, node.position.y, node.position.z);
				var counterOffset = tempM1;
				if (parentNode) {
					counterOffset.mul(parentNode.cumulativeMatrix, counterOffset);
					
					// TODO -T -> ROT -> T
					
					
				} else {
					counterOffset.copyFrom(tempM2);
				}
				
//				console.log(node.name, node.localPostureMatrix)
			}
		}
	};


	PMDBoneTree.Pose = function() {
		this.nameMap = {};
	};
	
	PMDBoneTree.Pose.prototype = {
		setBoneRotation: function(boneName, qx, qy, qz, qw) {
			this.nameMap[boneName] = new smallworld3d.geometry.Quaternion(qx, qy, qz, qw);
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
	}
	
	var tempM1 = new smallworld3d.geometry.M44();
	var tempM2 = new smallworld3d.geometry.M44();
	
	pkg.PMDBoneTree = PMDBoneTree;
})(window.smallworld3d);