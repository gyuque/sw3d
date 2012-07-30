(function(pkg) {
	'use strict';
	var M44 = pkg.geometry.M44;
	
	M44.prototype.perspectiveFOV = function(fov, aspect, znear, zfar) {
		var d = 1.0 / Math.tan(fov/2.0);
		var dZ = zfar - znear;
		this.ident();
		
		this._11 = d/aspect;
		                      this._22 = d;
		                                    this._33 = -zfar / dZ;  this._34 = -zfar*znear / dZ;
		                                    this._43 =         -1;  this._44 = 0;
	};

	M44.prototype.translate = function(x, y, z) {
		this._11 = 1;  this._12 = 0;  this._13 = 0;  this._14 = x;
		this._21 = 0;  this._22 = 1;  this._23 = 0;  this._24 = y;
		this._31 = 0;  this._32 = 0;  this._33 = 1;  this._34 = z;
		this._41 = 0;  this._42 = 0;  this._43 = 0;  this._44 = 1;
		return this;
	};

	M44.prototype.rotationX = function(a) {
		this._11 = 1; this._12 = 0; this._13 = 0; this._14 = 0;
		this._21 = 0;                             this._24 = 0;
		this._31 = 0;                             this._34 = 0;
		this._41 = 0; this._42 = 0; this._43 = 0; this._44 = 1;

		this._22 = Math.cos(a);  this._23 = -Math.sin(a);
		this._32 = Math.sin(a);  this._33 = Math.cos(a);
		
		return this;
	};

	M44.prototype.rotationY = function(a) {
		              this._12 = 0;               this._14 = 0;
		this._21 = 0; this._22 = 1; this._23 = 0; this._24 = 0;
		              this._32 = 0;               this._34 = 0;
		this._41 = 0; this._42 = 0; this._43 = 0; this._44 = 1;

		this._11 =  Math.cos(a);  this._13 = Math.sin(a);
		this._31 = -Math.sin(a);  this._33 = Math.cos(a);
		
		return this;
	};
	
	M44.prototype.rotationZ = function(a) {
		                            this._13 = 0; this._14 = 0;
		                            this._23 = 0; this._24 = 0;
		this._31 = 0; this._32 = 0; this._33 = 1; this._34 = 0;
		this._41 = 0; this._42 = 0; this._43 = 0; this._44 = 1;

		this._11 = Math.cos(a);  this._12 = -Math.sin(a);
		this._21 = Math.sin(a);  this._22 =  Math.cos(a);
		
		return this;
	};
	

})(window.smallworld3d);