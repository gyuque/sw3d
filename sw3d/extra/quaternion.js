/**
* Based on Three.js
*  @author mikael emtinger / http://gomo.se/
*  @author alteredq / http://alteredqualia.com/
*  @author WestLangley / http://github.com/WestLangley
*/

(function(pkg) {
	'use strict';
	
	function Quaternion(_x, _y, _z, _w) {
		this.x = _x;
		this.y = _y;
		this.z = _z;
		this.w = _w;
	}
	
	Quaternion.prototype = {
		multiplyVec3: function (objOut, vector) {
			var x = vector.x;
			var y = vector.y;
			var z = vector.z;
			
			var qx = this.x;
			var qy = this.y;
			var qz = this.z;
			var qw = this.w;
			
			// First mul
			var ix =  qw * x + qy * z - qz * y;
			var iy =  qw * y + qz * x - qx * z;
			var iz =  qw * z + qx * y - qy * x;
			var iw = -qx * x - qy * y - qz * z;
			
			// Second mul (and final result)
			objOut.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
			objOut.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
			objOut.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
		},
		
		generateRotationMatrix: function(mOut) {
			var basis = tmpV1;
			var rotBasis = tmpV2;
			
			// X basis
			basis.x = 1; basis.y = 0; basis.z = 0;
			this.multiplyVec3(rotBasis, basis);
			mOut._11 = rotBasis.x; mOut._21 = rotBasis.y; mOut._31 = rotBasis.z; mOut._41 = 0;
			
			// Y basis
			basis.x = 0; basis.y = 1; basis.z = 0;
			this.multiplyVec3(rotBasis, basis);
			mOut._12 = rotBasis.x; mOut._22 = rotBasis.y; mOut._32 = rotBasis.z; mOut._42 = 0;
			
			// Z basis
			basis.x = 0; basis.y = 0; basis.z = 1;
			this.multiplyVec3(rotBasis, basis);
			mOut._13 = rotBasis.x; mOut._23 = rotBasis.y; mOut._33 = rotBasis.z; mOut._43 = 0;

			mOut._14 = 0; mOut._24 = 0; mOut._34 = 0; mOut._44 = 1;
		}
	};
	
	var tmpV1 = new smallworld3d.geometry.Vec4();
	var tmpV2 = new smallworld3d.geometry.Vec4();
	
	pkg.geometry.Quaternion = Quaternion;
})(window.smallworld3d);