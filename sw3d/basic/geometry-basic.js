(function(pkg) {
	'use strict';
	var M44 = pkg.geometry.M44;
	
	/**
	 * Set perspective projection transform.
	 */
	M44.prototype.perspectiveFOV = function(fov, aspect, znear, zfar) {
		var d = 1.0 / Math.tan(fov/2.0);
		var dZ = zfar - znear;
		this.ident();
		
		this._11 = d/aspect;
		                      this._22 = d;
		                                    this._33 = -zfar / dZ;  this._34 = -zfar*znear / dZ;
		                                    this._43 =         -1;  this._44 = 0;
	};

	/**
	 * Set translation transform.
	 */
	M44.prototype.translate = function(x, y, z) {
		this._11 = 1;  this._12 = 0;  this._13 = 0;  this._14 = x;
		this._21 = 0;  this._22 = 1;  this._23 = 0;  this._24 = y;
		this._31 = 0;  this._32 = 0;  this._33 = 1;  this._34 = z;
		this._41 = 0;  this._42 = 0;  this._43 = 0;  this._44 = 1;
		return this;
	};

	/**
	 * Set rotation transform around X axis.
	 */
	M44.prototype.rotationX = function(a) {
		this._11 = 1; this._12 = 0; this._13 = 0; this._14 = 0;
		this._21 = 0;                             this._24 = 0;
		this._31 = 0;                             this._34 = 0;
		this._41 = 0; this._42 = 0; this._43 = 0; this._44 = 1;

		this._22 = Math.cos(a);  this._23 = -Math.sin(a);
		this._32 = Math.sin(a);  this._33 = Math.cos(a);
		
		return this;
	};

	/**
	 * Set rotation transform around Y axis.
	 */
	M44.prototype.rotationY = function(a) {
		              this._12 = 0;               this._14 = 0;
		this._21 = 0; this._22 = 1; this._23 = 0; this._24 = 0;
		              this._32 = 0;               this._34 = 0;
		this._41 = 0; this._42 = 0; this._43 = 0; this._44 = 1;

		this._11 =  Math.cos(a);  this._13 = Math.sin(a);
		this._31 = -Math.sin(a);  this._33 = Math.cos(a);
		
		return this;
	};

	/**
	 * Set rotation transform around Z axis.
	 */
	M44.prototype.rotationZ = function(a) {
		                            this._13 = 0; this._14 = 0;
		                            this._23 = 0; this._24 = 0;
		this._31 = 0; this._32 = 0; this._33 = 1; this._34 = 0;
		this._41 = 0; this._42 = 0; this._43 = 0; this._44 = 1;

		this._11 = Math.cos(a);  this._12 = -Math.sin(a);
		this._21 = Math.sin(a);  this._22 =  Math.cos(a);
		
		return this;
	};
	
	var vTmp1 = new pkg.geometry.Vec4();
	var vTmp2 = new pkg.geometry.Vec4();
	var vTmp3 = new pkg.geometry.Vec4();

	/**
	 * Set view transform viewing from [vFrom] to [vTo].
	 */
	M44.prototype.lookAt = function(vFrom, vTo, vUp) {
		// Make Z basis
		var z = vTmp1.copyFrom(vFrom).sub(vTo).normalize3();
		if (z.norm3() === 0) { z.z = 1; }
		
		// Make X basis
		var x = vTmp2.cp3(vUp, z).normalize3();
		if (x.norm3() === 0) {
			z.x += 0.0001;
			x.cp3(vUp, z).normalize3();
		}
		
		// Make Y basis
		var y = vTmp3.cp3(z, x);
		
		// Set *transposed* basis
		this._11 = x.x; this._21 = y.x; this._31 = z.x;
		this._12 = x.y; this._22 = y.y; this._32 = z.y;
		this._13 = x.z; this._23 = y.z; this._33 = z.z;
		this._41 = this._42 = this._43 = 0; this._44 =  1;
		
		// Set translation
		this._14 = -(vFrom.x * x.x + vFrom.y * x.y + vFrom.z * x.z);
		this._24 = -(vFrom.x * y.x + vFrom.y * y.y + vFrom.z * y.z);
		this._34 = -(vFrom.x * z.x + vFrom.y * z.y + vFrom.z * z.z);
	};
})(window.smallworld3d);