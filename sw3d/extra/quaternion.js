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
		}
	};
	
	pkg.geometry.Quaternion = Quaternion;
})(window.smallworld3d);