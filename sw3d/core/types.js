if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';

	function RGBAColor(_r, _g, _b, _a) {
		this.r = _r || 0;
		this.g = _g || 0;
		this.b = _b || 0;
		this.a = _a || 0;
	}
	
	RGBAColor.prototype = {
		copyFrom: function(src) {
			this.r = src.r;
			this.g = src.g;
			this.b = src.b;
			this.a = src.a;
		}
	};
	
	
	function UVCoordinate(_u, _v) {
		this.u = _u || 0;
		this.v = _v || 0;
	}
	
	function RasterizerVertexPosition(_x, _y, _z, _rhw) {
		this.x = _x;
		this.y = _y;
		this.z = _z;
		this.rhw = _rhw;
	}
	
	function Vertex3D() {
		this.position  = new smallworld3d.geometry.Vec4();
		this.N         = new smallworld3d.geometry.Vec4();
		this.textureUV = new UVCoordinate();
		this.color     = new RGBAColor(255, 255, 255, 255);
		
		this.position.w = 1;
	}

	function TransformedVertex() {
		this.position  = new smallworld3d.geometry.Vec4();
		this.textureUV = new UVCoordinate();
		this.N         = new smallworld3d.geometry.Vec4();
		this.color     = new RGBAColor();
	}

	function Viewport(w, h) {
		this.scaleX = w / 2;
		this.scaleY = -h / 2;
		this.centerX = w / 2;
		this.centerY = h / 2;
	}

	// ---- Export ----
	pkg.Vertex3D = Vertex3D;
	pkg.TransformedVertex = TransformedVertex;
	pkg.RGBAColor = RGBAColor;
	pkg.UVCoordinate = UVCoordinate;
	pkg.RasterizerVertexPosition = RasterizerVertexPosition;
	pkg.Viewport = Viewport;

})(window.smallworld3d);