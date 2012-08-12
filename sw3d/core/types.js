if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';

	/**
	 * @class RGBA Color
	 * @property {Number} r Red component (0-255)
	 * @property {Number} g Green component (0-255)
	 * @property {Number} b Blue component (0-255)
	 * @property {Number} a Alpha(opacity) component (0-255)
	 */
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
	
	
	/**
	 * @class Texture uv coordinate
	 * @property {Number} u U component
	 * @property {Number} v V component
	 */
	function UVCoordinate(_u, _v) {
		this.u = _u || 0;
		this.v = _v || 0;
	}
	
	/**
	 * @class Vertex position for rasterizer polygon
	 * @property {Number} x X component
	 * @property {Number} y Y component
	 * @property {Number} z Z component
	 * @property {Number} rhw RHW(Reciprocal of Homogeneous W) component
	 */
	function RasterizerVertexPosition(_x, _y, _z, _rhw) {
		this.x = _x;
		this.y = _y;
		this.z = _z;
		this.rhw = _rhw;
	}
	
	/**
	 * @class Vertex in 3D space
	 * @property {Vec4} position Position of this vertex
	 * @property {Vec4} N Normal vector
	 * @property {UVCoordinate} textureUV Texture coordinate
	 * @property {RGBAColor} color Vertex color
	 */
	function Vertex3D() {
		this.position  = new smallworld3d.geometry.Vec4();
		this.N         = new smallworld3d.geometry.Vec4();
		this.textureUV = new UVCoordinate();
		this.color     = new RGBAColor(255, 255, 255, 255);
		
		this.position.w = 1;
	}
	
	function TexturedMaterial(textureImageBuffer) {
		this.textureImageBuffer = textureImageBuffer;
		this.color = new RGBAColor(255, 255, 255, 255);
	}
	
	/**
	 * @class Vertex transformed to screen coordinates space 
	 * @property {Vec4} position Position of this vertex
	 * @property {Vec4} N Normal vector
	 * @property {UVCoordinate} textureUV Texture coordinate
	 * @property {RGBAColor} color Vertex color
	 */
	function TransformedVertex() {
		this.position  = new smallworld3d.geometry.Vec4();
		this.N         = new smallworld3d.geometry.Vec4();
		this.textureUV = new UVCoordinate();
		this.color     = new RGBAColor();
	}

	/**
	 * @class Viewport transform parameters 
	 * @property {Number} scaleX Scaling factor for X
	 * @property {Number} scaleY Scaling factor for Y
	 * @property {Number} centerX Origin of screen x coordinate
	 * @property {Number} centerY Origin of screen y coordinate
	 */
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
	pkg.TexturedMaterial = TexturedMaterial;

})(window.smallworld3d);