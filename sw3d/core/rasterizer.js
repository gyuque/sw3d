if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';

	function Rasterizer(imageBuffer) {
		this.target = imageBuffer;
		
		// Texture sampler. Set null to use no texture.
		this.textureSampler = null;
		
		// Attributes of triangle vertices
		this.vertexAttributes = [
			new VertexAttribute(), // A
			new VertexAttribute(), // B
			new VertexAttribute()  // C
		];
		
		// Edge objects (will be used while rasterizing)
		this.edges = [
			new PolygonEdge(), // A -> B
			new PolygonEdge(), // B -> C
			new PolygonEdge()  // C -> A
		];
		
		// Fill-colors
		//  for flat shading
		this.flatConstantColor = null;
		
		//  for gouraud shading
		this.leftSlope = null;
		this.rightSlope = null;
		this.allocateSlopeBuffer(this.target.height);
		this.spanFragment = new SlopeElement();
	}
	
	Rasterizer.prototype = {
		fillTriangle: function() {
			var vlist = this.vertexAttributes;
			var v1 = vlist[0], v2 = vlist[1], v3 = vlist[2];
			var x1 = v1.position.x, y1 = v1.position.y;
			var x2 = v2.position.x, y2 = v2.position.y;
			var x3 = v3.position.x, y3 = v3.position.y;
			
			// Update edges
			this.edges[0].setPositions(x1, y1, x2, y2);
			this.edges[1].setPositions(x2, y2, x3, y3);
			this.edges[2].setPositions(x3, y3, x1, y1);
			
			
			// Calc bounding box
			var t; // temp var for swap
			
			//  sort x
			var ix1 = 0, ix2 = 1, ix3 = 2;
			if (vlist[ix1].position.x > vlist[ix2].position.x) {t=ix1; ix1=ix2; ix2=t;}
			if (vlist[ix1].position.x > vlist[ix3].position.x) {t=ix1; ix1=ix3; ix3=t;}
			if (vlist[ix2].position.x > vlist[ix3].position.x) {t=ix2; ix2=ix3; ix3=t;}

			//  sort y
			var iy1 = 0, iy2 = 1, iy3 = 2;
			if (vlist[iy1].position.y > vlist[iy2].position.y) {t=iy1; iy1=iy2; iy2=t;}
			if (vlist[iy1].position.y > vlist[iy3].position.y) {t=iy1; iy1=iy3; iy3=t;}
			if (vlist[iy2].position.y > vlist[iy3].position.y) {t=iy2; iy2=iy3; iy3=t;}
			
			this.makeSlope(iy1, iy2, iy3);
			
			this.flatConstantColor = v1.color;
			this.scan(vlist[ix1].position.x, vlist[iy1].position.y,
				      vlist[ix3].position.x, vlist[iy3].position.y);
		},
		
		allocateSlopeBuffer: function(h) {
			function alloc() {
				var b = new Array(h);
				for (var i = 0;i < h;i++) {
					b[i] = new SlopeElement();
				}
				
				return b;
			}

			this.leftSlope = alloc();
			this.rightSlope = alloc();
		},
		
		setVertexAttribute: function(
			index,
			x, y, z, rhw,
			r, g, b, a,
			tu, tv) {
			
			if (index < 0 || index > 2) {
				throw "Bad index";
			}
			
			var v = this.vertexAttributes[index];
			v.position.x = Math.floor(x);
			v.position.y = Math.floor(y);
			v.position.z = z;
			v.position.rhw = rhw;

			v.color.r = r;
			v.color.g = g;
			v.color.b = b;
			v.color.a = a;
			
			v.textureUV.u = tu;
			v.textureUV.v = tv;
		},
		
		plotPoints: function() {
			this.putOneVertex(this.vertexAttributes[0]);
			this.putOneVertex(this.vertexAttributes[1]);
			this.putOneVertex(this.vertexAttributes[2]);
		},
		
		putOneVertex: function(v) {
			var x = v.position.x, y = v.position.y;
			var w = this.target.width, h = this.target.height;
			var fbPitch = w << 2;
			var p = this.target.color;
			
			if (y >= 0 && y < h && x >= 0 && x < w) {
				var pos = fbPitch * y + (x << 2);
				p[pos++] = 0;
				p[pos++] = 255;
				p[pos++] = 255;
				p[pos  ] = 255;
			}
		},
		
		makeSlope: function(iYmin, iYmid, iYmax) {
			var vlist = this.vertexAttributes;
			var v1 = vlist[iYmin], v2 = vlist[iYmid], v3 = vlist[iYmax];
			var x2 = v2.position.x;
			
			function calcSlopeOnEdge(vStart, vEnd, slope) {
				var y1 = vStart.position.y;
				var y2 = vEnd.position.y;
				var yLength = y2 - y1 + 0.5;

				for (var y = y1;y <= y2;++y) {
					var t = (y-y1+0.5) / yLength;
				
					if (slope[y]) {
						// Interpolate vertex attributes.
						// For example, vertex colors will generate a gradient.
						slope[y].interpolate(vStart, vEnd, t);
					}
				}
			}
			
			
			// Is mid point on left or right side?
			var dx = v3.position.x - v1.position.x;
			var dy = v3.position.y - v1.position.y;
			var dy_mid = v2.position.y - v1.position.y;
			
			if (dy == 0) {dy = 1};
			var x_mid = v1.position.x + (dx/dy) * dy_mid;
			if (x_mid < x2) {
				// |> Long edge is on left.
				// Left: v1-v3
				// Right: v1-v2-v3
				calcSlopeOnEdge(v1, v3, this.leftSlope);
				calcSlopeOnEdge(v1, v2, this.rightSlope);
				calcSlopeOnEdge(v2, v3, this.rightSlope);
			} else {
				// <| Long edge is on right.
				// Left: v1-v2-v3
				// Right: v1-v3
				calcSlopeOnEdge(v1, v2, this.leftSlope);
				calcSlopeOnEdge(v2, v3, this.leftSlope);
				calcSlopeOnEdge(v1, v3, this.rightSlope);
			}
		},
		
		scan: function(xmin, ymin, xmax, ymax) {
			var E0 = this.edges[0], E1 = this.edges[1], E2 = this.edges[2];
			
			var x, y;
			var w = this.target.width, h = this.target.height;
			var fbPitch = w << 2;
			var p = this.target.color;
			var pz = this.target.z;
			var pos;
			var zpos;
			var fragment = this.spanFragment;
			
			// Y clipping
			if (ymin < 0) {ymin = 0;}
			if (ymax >= h) {ymax = h-1;}
			
			// Initialize edge function value
			E0.start(xmin, ymin);
			E1.start(xmin, ymin);
			E2.start(xmin, ymin);
			
			// Scan over the bounding box of target triangle
			for (y = ymin;y <= ymax;++y) {
				var spanLeftEnd = this.leftSlope[y];
				var spanRightEnd = this.rightSlope[y];
				
				var lineOrigin = fbPitch * y;
				var xLeftEnd = Math.floor(spanLeftEnd.x);
				var xLength = Math.ceil(spanRightEnd.x + 1) - xLeftEnd;
				pos = null;
				
				for (x = xmin;x <= xmax;++x) {
					if (E0.edgeFuncVal <= 0 && // |
						E1.edgeFuncVal <= 0 && // |-> Evaluate edge function values
						E2.edgeFuncVal <= 0) { // |
						// Inside triangle
						if (x >= 0 && x < w) { // X clipping
							if (pos === null) {
								pos = lineOrigin + (x << 2);
								zpos = pos >> 2;
							}
							
							var xRatio = (x-xLeftEnd) / xLength;
							
							SlopeElement.interpolateSlopeElements(spanLeftEnd, spanRightEnd, xRatio, fragment);
							var pixelColor = fragment.color;
							var newZ = fragment.z;
						
							var zTestResult = (pz[zpos] > newZ);
							if (zTestResult) {
								p[pos++] = pixelColor.r;
								p[pos++] = pixelColor.g;
								p[pos++] = pixelColor.b;
								p[pos++] = pixelColor.a;
								pz[zpos++] = newZ;
							} else {
								// Z test is false
								// Advance one pixel
								pos += 4;
								++zpos;
							}
						} else {
							// Out of framebuffer
							// Advance one pixel
							pos += 4;
							++zpos;
						}

					} else /* Outside triangle */ if (pos !== null) {
						// We've reached right end!
						break;
					}
					
					E0.advanceX();
					E1.advanceX();
					E2.advanceX();
				}
				
				E0.nextLine();
				E1.nextLine();
				E2.nextLine();
			}
		}
	};
	
	function VertexAttribute() {
		this.position  = new pkg.RasterizerVertexPosition();
		this.color = new pkg.RGBAColor(255, 255, 255, 255);
		this.textureUV = new pkg.UVCoordinate();
	}
	
	function SlopeElement() {
		this.color = new pkg.RGBAColor(255, 255, 255, 255);
		this.x = 0;
		this.z = 0;
	}
	
	SlopeElement.interpolateSlopeElements = function(left, right, t, outElement) {
		var invT = 1.0 - t;
		
		// Color
		blendColor(outElement.color, left.color, right.color, invT);
		
		// Z
		outElement.z = left.z * invT + right.z * t;
	};
	
	SlopeElement.prototype = {
		interpolate: function(vStart, vEnd, t) {
			var invT = 1.0 - t;
			
			// Color
			blendColor(this.color, vStart.color, vEnd.color, invT);

			// X(Edge location)
			this.x = vStart.position.x * invT + vEnd.position.x * t;
			
			// Z(Depth)
			this.z = vStart.position.z * invT + vEnd.position.z * t;
		}
	};
	
	function blendColor(outColor, c1, c2, alpha1) {
		var alpha2 = 1.0 - alpha1;
		
		outColor.r = (c1.r * alpha1 + c2.r * alpha2) >> 0;
		outColor.g = (c1.g * alpha1 + c2.g * alpha2) >> 0;
		outColor.b = (c1.b * alpha1 + c2.b * alpha2) >> 0;
		outColor.a = (c1.a * alpha1 + c2.a * alpha2) >> 0;
	}
	
	// PolygonEdge object provides edge function
	function PolygonEdge() {
		this.x = 0;
		this.y = 0;
		this.dx = 0;
		this.dy = 0;
		this.edgeFuncValLeft = 0;
		this.edgeFuncVal = 0;
	}
	
	PolygonEdge.prototype = {
		setPositions: function(x1, y1, x2, y2) {
			x1 *= 2;
			y1 *= 2;
			x2 *= 2;
			y2 *= 2;
			
			this.x = x1;
			this.y = y1 ;
			this.dx = x2 - x1;
			this.dy = y2 - y1;
		},
		
		start: function(sx, sy) {
			// more about edge function, see:
			//   A parallel algorithm for polygon rasterization
			//   J Pineda - ACM SIGGRAPH Computer Graphics, 1988
			//   http://dl.acm.org/citation.cfm?id=378457
			
			// Shift sampling point 0.5 pixel to draw better edge.
			sx = sx*2 + 1;
			sy = sy*2 + 1;
			
			this.edgeFuncValLeft = (sx - this.x) * this.dy - (sy - this.y) * this.dx;
			this.edgeFuncVal = this.edgeFuncValLeft;
			return this.edgeFuncVal;
		},
		
		// Update edge function value
		advanceX: function() {
			// Set E(x+1, y)
			this.edgeFuncVal += this.dy;
			this.edgeFuncVal += this.dy;
		},
		
		nextLine: function() {
			// Set E(x, y+1)
			this.edgeFuncValLeft -= this.dx;
			this.edgeFuncValLeft -= this.dx;
			this.edgeFuncVal = this.edgeFuncValLeft;
		}
	};
	
	pkg.Rasterizer = Rasterizer;
})(window.smallworld3d);
