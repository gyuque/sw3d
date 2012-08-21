if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';

	/**
	 * @class Polygon Rasterizer
	 * @property {ImageBuffer} texture ImageBuffer object used as texture
	 * @property {boolean} enableZTest Set true to do z-test while drawing
	 * @property {Function} customShader Pixel shader function
	 * @property {Number} culling Culling direction
	 */
	function Rasterizer(imageBuffer) {
		// Public properties
		this.target = imageBuffer;
		this.texture = null;
		this.enableZTest = true;
		this.customShader = null;
		this.culling = Rasterizer.STANDARD_CULLING;
		
		// Texture sampler. Default is nearest sampler.
		this.textureSampler = smallworld3d.NearestTextureSampler ? new smallworld3d.NearestTextureSampler() : null;
		
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
		
		this.shaderOut = {
			color: new pkg.RGBAColor(255, 255, 255, 255),
			z: 0,
			discarded: false
		};
		
		// Fill-colors
		//  for flat shading
		this.flatConstantColor = null;
		
		//  for interpolation
		this.leftSlope = null;
		this.rightSlope = null;
		this.allocateSlopeBuffer(this.target.height);
		this.spanFragment = new SlopeElement();
		this.textureFragment = new smallworld3d.RGBAColor();
	}
	
	Rasterizer.STANDARD_CULLING = 0;
	Rasterizer.REVERSE_CULLING  = 1;
	
	Rasterizer.prototype = {
		/**
		 * Render a filled triangle using current vertex attributes.
		 */
		fillTriangle: function() {
			var vlist = this.vertexAttributes;
			var v1 = vlist[0], v2 = vlist[1], v3 = vlist[2];
			
			// Culling
			if (this.cullTest(v1.position, v2.position, v3.position) < 0) {
				return;
			}
			
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

		/**
		 * Set current texure.
		 */
		setTexture: function(imageBuffer) {
			this.texture = imageBuffer || null;
		},
		
		/**
		 * Set vertex attribute on specified vertex.
		 */
		setVertexAttribute: function(
			index,
			x, y, z, rhw,
			r, g, b, a,
			tu, tv, ts, tt) {
			
			if (index < 0 || index > 2) {
				throw "Bad index";
			}
			
			var v = this.vertexAttributes[index];
			v.position.x = x;
			v.position.y = y;
			v.position.z = z;
			v.position.rhw = rhw;

			v.color.r = r;
			v.color.g = g;
			v.color.b = b;
			v.color.a = a;
			
			v.textureUV.u = tu || 0;
			v.textureUV.v = tv || 0;
			v.textureUV.s = ts || 0;
			v.textureUV.t = tt || 0;
		},
		
		plotPoints: function() {
			this.putOneVertex(this.vertexAttributes[0]);
			this.putOneVertex(this.vertexAttributes[1]);
			this.putOneVertex(this.vertexAttributes[2]);
		},
		
		cullTest: function(v1, v2, v3) {
			var cullingDir = (this.culling === Rasterizer.STANDARD_CULLING) ? 1 : -1;
			return cullingDir * smallworld3d.geometry.crossproduct2(v2.x - v1.x, v2.y - v1.y, v3.x - v2.x, v3.y - v2.y);
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
		
		putOneVertex: function(v) {
			var c = v.color;
			var x = v.position.x, y = v.position.y >> 0;
			var w = this.target.width, h = this.target.height;
			var fbPitch = w << 2;
			var p = this.target.color;
			
			if (y >= 0 && y < h && x >= 0 && x < w) {
				var pos = fbPitch * y + (x << 2);
				p[pos++] = c.r;
				p[pos++] = c.g;
				p[pos++] = c.b;
				p[pos  ] = 255;
			}
		},
		
		makeSlope: function(iYmin, iYmid, iYmax) {
			var vlist = this.vertexAttributes;
			var v1 = vlist[iYmin], v2 = vlist[iYmid], v3 = vlist[iYmax];
			var x2 = v2.position.x;
			
			function calcSlopeOnEdge(vStart, vEnd, slope) {
				var y1f = vStart.position.y;
				var y2f = vEnd.position.y;
				var yLength = y2f - y1f;
				var y1 = Math.floor(y1f + 0.5);
				var y2 = Math.floor(y2f + 0.5);
				
				for (var y = y1;y < y2;++y) {
					var t = (y+0.5-y1f) / yLength;
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
			var p = this.target.color;
			var pz = this.target.z;
			var pos;
			var zpos;
			var fragment = this.spanFragment;
			var tex_fragment = this.textureFragment;
			
			var zAlwaysPass = !this.enableZTest;
			
			// to integer
			ymin = Math.floor(ymin + 0.5);
			ymax = Math.ceil(ymax + 0.5);
			xmin = Math.floor(xmin + 0.5);
			xmax = Math.ceil(xmax + 0.5);
			
			// Y clipping
			if (ymin < 0) {ymin = 0;}
			if (ymax > h) {ymax = h;}
			
			// X clipping
			if (xmin < 0) {xmin = 0;}
			if (xmax > w) {xmax = w;}
			
			// Initialize edge function values
			var cullingDir = (this.culling === Rasterizer.STANDARD_CULLING) ? 1 : -1;
			
			var e0 = E0.start(xmin, ymin, cullingDir);
			var e1 = E1.start(xmin, ymin, cullingDir);
			var e2 = E2.start(xmin, ymin, cullingDir);

			var edx0 = E0.getStep();
			var edx1 = E1.getStep();
			var edx2 = E2.getStep();

			
			var tex = this.texture;
			var sampler = this.textureSampler;
			var useTexture = !!tex;
			
			var shader = this.customShader;
			var useShader = !!shader;
			var shaderOut = this.shaderOut;
			
			// Scan over the bounding box of target triangle
			var lineOrigin = w * ymin;
			for (y = ymin;y < ymax;++y) {
				var spanLeftEnd = this.leftSlope[y];
				var spanRightEnd = this.rightSlope[y];
				
				var xLeftEnd = Math.floor(spanLeftEnd.x + 0.5);
				var xRightEnd = Math.ceil(spanRightEnd.x + 0.5);
				var xLength   = xRightEnd - xLeftEnd;
				var spanLength = 0;
				
				for (x = xmin;x <= xmax;++x) {
					if (e0 <= 0 && // |
						e1 <= 0 && // |-> Evaluate edge function values
						e2 <= 0 && // |
						x < xmax) { // -------------> Reached right end of framebuffer?
						// Inside triangle
						++spanLength;
					} else /* Outside triangle */  {
						if (spanLength) { 
							// We've reached right end!
							var xOffset = (x - spanLength) - xLeftEnd;
							
							zpos = lineOrigin + (x - spanLength);
							pos = zpos << 2;
							for (x = 0;x < spanLength;x++) {
								var xRatio = (x+xOffset) / xLength;
								SlopeElement.interpolateSlopeElements(spanLeftEnd, spanRightEnd, xRatio, fragment);

								// Depth(Z) Test
								var newZ = fragment.z;
								var zTestResult = zAlwaysPass || (pz[zpos] > newZ);

								if (zTestResult && newZ >= 0 && newZ <= 1) {
									var pixelColor;
									if (useShader) {
										shaderOut.discarded = false;
										shaderOut.z = newZ;
										shader(this, shaderOut, fragment);
										pixelColor = shaderOut.color;
										newZ = shaderOut.z;
										
										// Fragment is discarded by shader
										if (shaderOut.discarded) {
											++pos; ++pos; ++pos; ++pos;
											++zpos;
											continue;
										}
									} else {
										pixelColor = fragment.color;
				
										if (useTexture) {
											// Fetch a texel from texture
											sampler.getPixel(tex_fragment, tex, fragment.tu, fragment.tv);

											// Blend with vertex color
											pixelColor.r = tex_fragment.r * pixelColor.r / 255;
											pixelColor.g = tex_fragment.g * pixelColor.g / 255;
											pixelColor.b = tex_fragment.b * pixelColor.b / 255;
											pixelColor.a = tex_fragment.a * pixelColor.a / 255;
										}
									}
									
									if (pixelColor.a > 0 && pixelColor.a < 255) { // This framgent is not opaque
										// Do alpha blending
										blendColorDirect(pixelColor, pixelColor, 
											p[pos],p[pos+1],p[pos+2],p[pos+3], pixelColor.a / 255); 
									}
									
									if (pixelColor.a === 0) {
										++pos;
										++pos;
										++pos;
										++pos;
									} else {
										p[pos++] = pixelColor.r;
										p[pos++] = pixelColor.g;
										p[pos++] = pixelColor.b;
										p[pos++] = pixelColor.a;
									}
									
									pz[zpos++] = newZ;
								} else {
									// Z test is false
									// Advance one pixel
									pos += 4;
									++zpos;
								}

							}
							
							break;
						}
						// else: left side of triangle...
					}
					
					// Update edge function values
					e0 += edx0;
					e1 += edx1;
					e2 += edx2;
				}
				
				e0 = E0.nextLine();
				e1 = E1.nextLine();
				e2 = E2.nextLine();
				lineOrigin += w;
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
		this.tu = 0;
		this.tv = 0;
		this.ts = 0;
		this.tt = 0;
		this.rhw = 1;
	}
	
	SlopeElement.interpolateSlopeElements = function(left, right, t, outElement) {
		var invT = 1.0 - t;
		
		// Color
		blendColor(outElement.color, left.color, right.color, invT);
		
		// Z
		outElement.z = left.z * invT + right.z * t;
		
		// Texture Coordinates
		outElement.tu = (left.tu / left.rhw) * invT + (right.tu / right.rhw) * t;
		outElement.tv = (left.tv / left.rhw) * invT + (right.tv / right.rhw) * t;
		outElement.ts = (left.ts / left.rhw) * invT + (right.ts / right.rhw) * t;
		outElement.tt = (left.tt / left.rhw) * invT + (right.tt / right.rhw) * t;
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
			
			
			var rhw1 = vStart.position.rhw;
			var rhw2 = vEnd.position.rhw;
			
			// Texture Coordinates
			this.tu = vStart.textureUV.u * rhw1 * invT + vEnd.textureUV.u * rhw2 * t;
			this.tv = vStart.textureUV.v * rhw1 * invT + vEnd.textureUV.v * rhw2 * t;
			this.ts = vStart.textureUV.s * rhw1 * invT + vEnd.textureUV.s * rhw2 * t;
			this.tt = vStart.textureUV.t * rhw1 * invT + vEnd.textureUV.t * rhw2 * t;
			
			// RHW
			this.rhw = rhw1 * invT + rhw2 * t;
		}
	};
	
	function blendColor(outColor, c1, c2, alpha1) {
		var alpha2 = 1.0 - alpha1;
		
		outColor.r = (c1.r * alpha1 + c2.r * alpha2) >> 0;
		outColor.g = (c1.g * alpha1 + c2.g * alpha2) >> 0;
		outColor.b = (c1.b * alpha1 + c2.b * alpha2) >> 0;
		outColor.a = (c1.a * alpha1 + c2.a * alpha2) >> 0;
	}

	function blendColorDirect(outColor, c1, r,g,b,a, alpha1) {
		var alpha2 = 1.0 - alpha1;
		
		outColor.r = (c1.r * alpha1 + r * alpha2) >> 0;
		outColor.g = (c1.g * alpha1 + g * alpha2) >> 0;
		outColor.b = (c1.b * alpha1 + b * alpha2) >> 0;
		outColor.a = (c1.a * alpha1 + a * alpha2) >> 0;
	}
	
	// PolygonEdge object provides edge function
	function PolygonEdge() {
		this.x = 0;
		this.y = 0;
		this.dx = 0;
		this.dy = 0;
		this.edgeFuncValLeft = 0;
		this.edgeFuncVal = 0;

		this.dx2 = 0;
		this.dy2 = 0;
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
		
		start: function(sx, sy, sign) {
			// more about edge function, see:
			//   A parallel algorithm for polygon rasterization
			//   J Pineda - ACM SIGGRAPH Computer Graphics, 1988
			//   http://dl.acm.org/citation.cfm?id=378457
			
			// Shift sampling point 0.5 pixel to draw better edge.
			sx = sx*2 + 1;
			sy = sy*2 + 1;

			this.dx2 = this.dx * 2 * sign; // cache dx*2
			this.dy2 = this.dy * 2 * sign; // cache dy*2
			
			this.edgeFuncValLeft = ((sx - this.x) * this.dy - (sy - this.y) * this.dx) * sign;
			this.edgeFuncVal = this.edgeFuncValLeft;
			return this.edgeFuncVal;
		},
		
		getStep: function() {
			return this.dy2;
		},
		
		nextLine: function() {
			// Set E(x, y+1)
			this.edgeFuncValLeft -= this.dx2;
			this.edgeFuncVal = this.edgeFuncValLeft;
			
			return this.edgeFuncVal;
		}
	};
	
	pkg.Rasterizer = Rasterizer;
})(window.smallworld3d);
