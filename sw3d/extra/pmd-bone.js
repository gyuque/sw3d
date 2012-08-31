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
		
		registerIKBone: function(ik) {
			var i;
			var ikNode = this.getByIndex(ik.selfIndex);
			ikNode.isIK = true;
			
			ikNode.ikAffectList = [];
			ikNode.ikTargetNode = this.getByIndex(ik.targetIndex);
			ikNode.ikIterations = ik.iterations;
			ikNode.ikWeight = ik.weight;
			for (i = 0;i < ik.affects.length;i++) {
				ikNode.ikAffectList.push( this.getByIndex(ik.affects[i]) );
			}
		},
		
		setXAxisConstraint: function(matchString) {
			var ls = this.list;
			var len = ls.length;
			
			for (var i = 0;i < len;i++) {
				var nd = ls[i];
				if (nd.name.indexOf(matchString) >= 0) {
					nd.hasXAxisConstraint = true;
				}
			}
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
			if (pose) {
				var q = pose.getRotationQuaternion(node.name);
				if (q) {
					q.generateRotationMatrix(node.localPostureMatrix);
				} else {
					node.localPostureMatrix.ident();
				}
			}
			// if pose is null, use current posture

			// Calc rotation around bone position
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
		},
		
		// IK --------------------------------------------------
		
		applyIK: function(pose) {
			var ls = this.list;
			var len = ls.length;
			for (var i = 0;i < len;++i) {
				var bone = ls[i];
				if (bone.isIK) { // This is an IK bone.
					var pos = pose.getPosition(bone.name);
					if (pos) { // Offset is set.
						
						// Is offset valid?
						if (!nearlyEq(0, pos.x) || !nearlyEq(0, pos.y) || !nearlyEq(0, pos.z)) {
							var iter = bone.ikIterations;
							
							// Calc min length to terminate iteration
							var minLen = tempV1.copyFrom(bone.ikTargetNode.position).
							             sub(this.getByIndex(bone.ikTargetNode.parentIndex).position).
							             norm3() * 
							             0.1;
							
							for (var j = 0;j < iter;++j) {
								if (!this.calcIKBone(bone, pos, minLen)) {
									break;
								}
							}
						}
					}
				}
			}
		},
		
		calcIKBone: function(ikbone, ikOffset, minLen) {
			var affectedBoneList = ikbone.ikAffectList;
			var targetNode = ikbone.ikTargetNode;

			var needMore = true;
			var alen = affectedBoneList.length;
			for (var i = 0;i < alen;++i) {
				var ikChild = affectedBoneList[i];
				if (!this.bendIKChild(ikChild, targetNode, ikbone, ikOffset, minLen)) {
					needMore = false;
				}
			}
			
			return needMore;
		},
		
		bendIKChild: function(ikChild, ikTarget, ikSelf, ikOffset, minLen) {
			var vChToTarget = tempV1;
			var vChildPos   = tempV2;
			var vChToIK     = tempV3.copyFrom(ikSelf.position).add(ikOffset);

			this.DEBUGPOS = {
				x: vChToIK.x,
				y: vChToIK.y,
				z: vChToIK.z
			}
			
			// Calc vectors
			applyCumulative(ikTarget, vChToTarget, ikTarget.position);
			applyCumulative(ikChild,  vChildPos, ikChild.position);
			applyCumulative(ikSelf, vChToIK, vChToIK);

			// Termination check
			var currentLen = tempV4.copyFrom(vChToIK).
			                        sub(vChToTarget).
			                        norm3();
			
			if (currentLen < minLen) {
				return false;
			}

			vChToTarget.sub(vChildPos);
			vChToIK.sub(vChildPos);
			vChildPos = null;
			
			// Calc angle and axis
			var vN = tempV2.cp3(vChToTarget, vChToIK); // gets N
			var Nlen = vN.norm3(); // save length of N vector
			vN.normalize3(); // normalize N
			
			var dp = vChToTarget.dp3(vChToIK);
			var angle = Math.asin(Nlen / ( vChToTarget.norm3() * vChToIK.norm3() ));
			if (dp < 0) {
				angle = Math.PI - angle;
			}
			
			// Consider limit of angle
			var amax = ikSelf.ikWeight * 4.0;
			if (angle > amax) {
				angle = amax;
			}

			
			tempQ1.setRotationAxis(vN, angle);
			if (ikChild.hasXAxisConstraint) {
				// First, apply rotation without constraint
				tempQ1.generateRotationMatrix(tempM1);
				tempM2.copyFrom(ikChild.localPostureMatrix);
				ikChild.localPostureMatrix.mul(tempM1, tempM2);
				var beforeConstraintQ = tempQ2.setFromRotationMatrix(ikChild.localPostureMatrix);
				beforeConstraintQ.invert(); // Cancel current rotation
				
				// Consider axis constraints...
				var xrotQ = tempQ3;
				var rCos = beforeConstraintQ.w;
				var rSin = Math.sqrt(1.0 - rCos*rCos);
				xrotQ.x = rSin;
				xrotQ.y = 0;
				xrotQ.z = 0;
				xrotQ.w = rCos;
				
				tempQ1.mul(xrotQ, beforeConstraintQ);
			}
			
			// Update posture of the child
			tempQ1.generateRotationMatrix(tempM1);
			tempM2.copyFrom(ikChild.localPostureMatrix);
			// Update matrices
			ikChild.localPostureMatrix.mul(tempM1, tempM2);
			this.setRotationAroundBone(null, ikChild, this.getByIndex(ikChild.parentIndex), true);
			this.updateChildrenRotation(null, ikChild.children, ikChild);
			
			return true;
		}
	};

	function applyCumulative(bone, vOut, vIn) {
		var x = vIn.x;
		var y = vIn.y;
		var z = vIn.z;
		bone.cumulativeMatrix.transformVec3(vOut, x, y, z);
	}


	PMDBoneTree.Pose = function() {
		this.nameMap = {};
		this.namePosMap = {};
		this.convertDirectX = true;
	};
	
	PMDBoneTree.Pose.prototype = {
		setBoneRotation: function(boneName, qx, qy, qz, qw) {
			if (!this.nameMap[boneName]) {
				this.nameMap[boneName] = new smallworld3d.geometry.Quaternion();
			}

			var q = this.nameMap[boneName];
			if (this.convertDirectX) {
				q.x = -qx;
				q.y = -qy;
			} else {
				q.x = qx;
				q.y = qy;
			}
			
			q.z = qz;
			q.w = qw;
		},
		
		setBonePosition: function(boneName, x, y, z) {
			this.namePosMap[boneName] = new smallworld3d.geometry.Vec4(x, y, z);
		},
		
		getRotationQuaternion: function(boneName) {
			return this.nameMap[boneName] || null;
		},

		getPosition: function(boneName) {
			return this.namePosMap[boneName] || null;
		},
		
		reset: function() {
			var bname;
			for (bname in this.nameMap) {
				var q = this.nameMap[bname];
				q.x = q.y = q.z = 0;
				q.w = 1;
			}

			for (bname in this.namePosMap) {
				var v = this.namePosMap[bname];
				v.x = v.y = v.z = 0;
			}
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
		this.hasXAxisConstraint = false;
		
		this.isIK = false;
		this.ikWeight = 0;
		this.ikIterations = 0;
		this.ikTargetNode = null;
		this.ikAffectList = null;
	}
	
	function nearlyEq(a, b) {
		var d = a - b;
		if (d < 0){d = -d;}
		return (d < 0.00001) && (d > -0.00001);
	}
	
	var tempQ1 = new smallworld3d.geometry.Quaternion();
	var tempQ2 = new smallworld3d.geometry.Quaternion();
	var tempQ3 = new smallworld3d.geometry.Quaternion();
	var tempV1 = new smallworld3d.geometry.Vec4();
	var tempV2 = new smallworld3d.geometry.Vec4();
	var tempV3 = new smallworld3d.geometry.Vec4();
	var tempV4 = new smallworld3d.geometry.Vec4();
	var tempM1 = new smallworld3d.geometry.M44();
	var tempM2 = new smallworld3d.geometry.M44();
	var tempM3 = new smallworld3d.geometry.M44();
	
	pkg.PMDBoneTree = PMDBoneTree;
})(window.smallworld3d);