if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';

	// ---- 2D Vector ----
	function Vec2(_x, _y) {
		this.x = _x || 0;
		this.y = _y || 0;
	}


	
	// ---- xyz+w Vector ----
	function Vec4(_x, _y, _z, _w) {
		this.x = _x || 0;
		this.y = _y || 0;
		this.z = _z || 0;
		this.w = _w || 0;
	}
	
	Vec4.prototype = {
		copyFrom: function(copySource) {
			this.x = copySource.x;
			this.y = copySource.y;
			this.z = copySource.z;
			this.w = copySource.w;
			
			return this;
		},

		add: function(v) {
			this.x += v.x;
			this.y += v.y;
			this.z += v.z;
			this.w += v.w;
			
			return this;
		},
		
		sub: function(v) {
			this.x -= v.x;
			this.y -= v.y;
			this.z -= v.z;
			this.w -= v.w;
			
			return this;
		},
		
		mul: function(k) {
			this.x *= k;
			this.y *= k;
			this.z *= k;
			this.w *= k;
			
			return this;
		},
		
		// dot product ignoring w
		dp3: function(v)	{
			return this.x*v.x + this.y*v.y + this.z*v.z;
		},
		
		// dot product using all components
		dp4: function(v)	{
			return this.x*v.x + this.y*v.y + this.z*v.z + this.w*v.w;
		},
		
		// cross product ignoring w
		cp3: function(v, w) {
			this.x = (v.y * w.z) - (v.z * w.y);
			this.y = (v.z * w.x) - (v.x * w.z);
			this.z = (v.x * w.y) - (v.y * w.x);
			return this;
		},
		
		// norm of (x, y, z)
		norm3: function() {
			return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
		},
		
		normalize3: function() {
			var n = this.norm3();
			if (n != 0)
			{
				this.x /= n;
				this.y /= n;
				this.z /= n;
			}
			return this;
		}
	};

	// ---- 4x4 Matrix ----
	function M44(copySource) {
		if (copySource) {
			this.copyFrom(copySource);
		} else {
			this.ident();
		}
	}
	
	M44.prototype = {
		ident: function() {
				  this._12 = this._13 = this._14 = 0;
			this._21 =       this._23 = this._24 = 0;
			this._31 = this._32 =       this._34 = 0;
			this._41 = this._42 = this._43 =       0;

			this._11 = this._22 = this._33 = this._44 = 1;

			return this;
		},

		copyFrom: function(m) {
			this._11 = m._11;  this._12 = m._12;  this._13 = m._13;  this._14 = m._14;
			this._21 = m._21;  this._22 = m._22;  this._23 = m._23;  this._24 = m._24;
			this._31 = m._31;  this._32 = m._32;  this._33 = m._33;  this._34 = m._34;
			this._41 = m._41;  this._42 = m._42;  this._43 = m._43;  this._44 = m._44;
		
			return this;
		},

		makeTransposed: function(m) {
			this._11 = m._11;  this._12 = m._21;  this._13 = m._31;  this._14 = m._41;
			this._21 = m._12;  this._22 = m._22;  this._23 = m._32;  this._24 = m._42;
			this._31 = m._13;  this._32 = m._23;  this._33 = m._33;  this._34 = m._43;
			this._41 = m._14;  this._42 = m._24;  this._43 = m._34;  this._44 = m._44;
			
			return this;
		},
		
		transformVec3: function(outV, x, y, z) {
			outV.x = x * this._11 + y * this._12 + z * this._13 + this._14;
			outV.y = x * this._21 + y * this._22 + z * this._23 + this._24;
			outV.z = x * this._31 + y * this._32 + z * this._33 + this._34;
			outV.w = x * this._41 + y * this._42 + z * this._43 + this._44;
		},
		
		transformVec3WithoutTranslation: function(outV, x, y, z) {
			outV.x = x * this._11 + y * this._12 + z * this._13;
			outV.y = x * this._21 + y * this._22 + z * this._23;
			outV.z = x * this._31 + y * this._32 + z * this._33;
		},
		
		mul: function(A, B) {
			this._11 = A._11*B._11  +  A._12*B._21  +  A._13*B._31  +  A._14*B._41;
			this._12 = A._11*B._12  +  A._12*B._22  +  A._13*B._32  +  A._14*B._42;
			this._13 = A._11*B._13  +  A._12*B._23  +  A._13*B._33  +  A._14*B._43;
			this._14 = A._11*B._14  +  A._12*B._24  +  A._13*B._34  +  A._14*B._44;

			this._21 = A._21*B._11  +  A._22*B._21  +  A._23*B._31  +  A._24*B._41;
			this._22 = A._21*B._12  +  A._22*B._22  +  A._23*B._32  +  A._24*B._42;
			this._23 = A._21*B._13  +  A._22*B._23  +  A._23*B._33  +  A._24*B._43;
			this._24 = A._21*B._14  +  A._22*B._24  +  A._23*B._34  +  A._24*B._44;

			this._31 = A._31*B._11  +  A._32*B._21  +  A._33*B._31  +  A._34*B._41;
			this._32 = A._31*B._12  +  A._32*B._22  +  A._33*B._32  +  A._34*B._42;
			this._33 = A._31*B._13  +  A._32*B._23  +  A._33*B._33  +  A._34*B._43;
			this._34 = A._31*B._14  +  A._32*B._24  +  A._33*B._34  +  A._34*B._44;

			this._41 = A._41*B._11  +  A._42*B._21  +  A._43*B._31  +  A._44*B._41;
			this._42 = A._41*B._12  +  A._42*B._22  +  A._43*B._32  +  A._44*B._42;
			this._43 = A._41*B._13  +  A._42*B._23  +  A._43*B._33  +  A._44*B._43;
			this._44 = A._41*B._14  +  A._42*B._24  +  A._43*B._34  +  A._44*B._44;

			return this;
		}
	};
	
	function crossproduct2(x1, y1, x2, y2) {
		return x1 * y2 - y1 * x2;
	}
	
	// ---- Export ----
	pkg.geometry = {
		Vec2: Vec2,
		Vec4: Vec4,
		M44: M44,
		crossproduct2: crossproduct2
	};
})(window.smallworld3d);