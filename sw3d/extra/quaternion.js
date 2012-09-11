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
		copyFrom: function(copySource) {
			this.x = copySource.x;
			this.y = copySource.y;
			this.z = copySource.z;
			this.w = copySource.w;
			
			return this;
		},
		
		mul: function (a, b) {
			// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
			var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w,
			qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

			this.x = qax * qbw + qay * qbz - qaz * qby + qaw * qbx;
			this.y = -qax * qbz + qay * qbw + qaz * qbx + qaw * qby;
			this.z = qax * qby - qay * qbx + qaz * qbw + qaw * qbz;
			this.w = -qax * qbx - qay * qby - qaz * qbz + qaw * qbw;

			return this;
		},
		
		invert: function() {
			this.x *= -1;
			this.y *= -1;
			this.z *= -1;
			
			return this;
		},
		
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
		
		setRotationAxis: function(axis, angle) {
			// from http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
			// axis have to be normalized

			var halfAngle = angle / 2;
			var s = Math.sin(halfAngle);

			this.x = axis.x * s;
			this.y = axis.y * s;
			this.z = axis.z * s;
			this.w = Math.cos(halfAngle);

			return this;
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
			
			return this;
		},
		
		setFromRotationMatrix: function (m) {
			// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
			// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

			var m11 = m._11,  m12 = m._12,  m13 = m._13;
			var m21 = m._21,  m22 = m._22,  m23 = m._23;
			var m31 = m._31,  m32 = m._32,  m33 = m._33;
			var trace = m11 + m22 + m33;
			var s;

			if( trace > 0 ) {
				s = 0.5 / Math.sqrt( trace + 1.0 );

				this.w = 0.25 / s;
				this.x = ( m32 - m23 ) * s;
				this.y = ( m13 - m31 ) * s;
				this.z = ( m21 - m12 ) * s;
			} else if ( m11 > m22 && m11 > m33 ) {
				s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

				this.w = (m32 - m23 ) / s;
				this.x = 0.25 * s;
				this.y = (m12 + m21 ) / s;
				this.z = (m13 + m31 ) / s;
			} else if (m22 > m33) {
				s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

				this.w = (m13 - m31 ) / s;
				this.x = (m12 + m21 ) / s;
				this.y = 0.25 * s;
				this.z = (m23 + m32 ) / s;
			} else {
				s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

				this.w = ( m21 - m12 ) / s;
				this.x = ( m13 + m31 ) / s;
				this.y = ( m23 + m32 ) / s;
				this.z = 0.25 * s;
			}

			return this;
		},
		
		makeSlerp: function (qa, qb, t) {
			// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
			var cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;
			var qm = this;
			
			if (cosHalfTheta < 0) {
				qm.w = -qb.w;
				qm.x = -qb.x;
				qm.y = -qb.y;
				qm.z = -qb.z;

				cosHalfTheta = -cosHalfTheta;
			} else {
				qm.copyFrom(qb);
			}
			
			if (Math.abs(cosHalfTheta) >= 1.0) {
				qm.w = qa.w;
				qm.x = qa.x;
				qm.y = qa.y;
				qm.z = qa.z;

				return qm;
			}
			
			var halfTheta = Math.acos(cosHalfTheta);
			var sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

			if (Math.abs(sinHalfTheta) < 0.001) {
				qm.w = 0.5 * (qa.w + qm.w);
				qm.x = 0.5 * (qa.x + qm.x);
				qm.y = 0.5 * (qa.y + qm.y);
				qm.z = 0.5 * (qa.z + qm.z);

				return qm;
			}
			
			var ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
			var ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

			qm.w = (qa.w * ratioA + qm.w * ratioB);
			qm.x = (qa.x * ratioA + qm.x * ratioB);
			qm.y = (qa.y * ratioA + qm.y * ratioB);
			qm.z = (qa.z * ratioA + qm.z * ratioB);

			return qm;
		},
		
		toString: function() {
			return "(" + this.w + "; " + this.x + ", " + this.y + ", " + this.z + ")";
		}
	};
	
	function testSlerp() {
		var q1 = (new Quaternion()).setRotationAxis(new smallworld3d.geometry.Vec4(0, 1, 0), 0.2);
		var q2 = (new Quaternion()).setRotationAxis(new smallworld3d.geometry.Vec4(1, 0, 0), 0.5);
		console.log("slerpTest - - - - - - - - - - -");
		console.log(q1 + "  " +q2);
		
		var q3 = new Quaternion();
		q3.makeSlerp(q1, q2, 0.3);
		console.log("  "+q3);
	}
	
	//testSlerp();
	
	var tmpV1 = new smallworld3d.geometry.Vec4();
	var tmpV2 = new smallworld3d.geometry.Vec4();
	
	pkg.geometry.Quaternion = Quaternion;
})(window.smallworld3d);