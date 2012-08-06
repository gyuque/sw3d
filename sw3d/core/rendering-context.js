if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function RenderingContext(w, h) {
		w = w || 256;
		h = h || 256;
		
		this._tempV = new smallworld3d.geometry.Vec4();
		this.viewport = new smallworld3d.Viewport(w, h);
		
		var M44 = smallworld3d.geometry.M44;
		this.projectionTransform = new M44();
		this.viewTransform       = new M44();
		this.worldTransform      = new M44();
		
		this.imageBuffer = new smallworld3d.ImageBuffer(w, h, true);
		this.rasterizer = new smallworld3d.Rasterizer(this.imageBuffer);
		
		this.combinedTransforms = {
			worldView: new M44(),
			worldViewProjection: new M44()
		};
		
		this.lights = [];
		this.customVertexShader = null;
	}
	
	RenderingContext.prototype = {
		/**
		 * Set new viewport.
		 */
		setViewport: function(vp) {
			this.viewport = vp;
		},
		
		/**
		 * Transform vertices in specifeid list using current transform settings.
		 */
		transformVertices: function(outBuffer, inBuffer) {
			this.updateTransforms();
			var mAll = this.combinedTransforms.worldViewProjection;
			var mRot = this.worldTransform;
			var shader = this.customVertexShader;
			
			var len = inBuffer.length;
			for (var i = 0;i < len;i++) {
				var v_in = inBuffer[i];
				var v_out = outBuffer[i];
				
				if (shader) {
					shader(this, v_out, v_in);
				} else {
					var p_in = v_in.position;
					var n_in = v_in.N;
					var p_out = v_out.position;
				
					mAll.transformVec3(p_out, p_in.x, p_in.y, p_in.z);
					mRot.transformVec3WithoutTranslation(v_out.N, n_in.x, n_in.y, n_in.z);
					v_out.N.normalize3();
				
					p_out.x /= p_out.w;
					p_out.y /= p_out.w;
					p_out.z /= p_out.w;
				
					v_out.color.copyFrom(v_in.color);
					v_out.textureUV.u = v_in.textureUV.u;
					v_out.textureUV.v = v_in.textureUV.v;
				}
			}
			
			this.applyAllLights(outBuffer);
		},
		
		addLight: function(light) {
			this.lights.push(light);
		},
		
		applyAllLights: function(vList) {
			var ls = this.lights;
			var len = ls.length;
			for (var i = 0;i < len;i++) {
				this.applyLight(ls[i], vList);
			}
			
			this.capColorValue(vList);
		},
		
		applyLight: function(light, vList) {
			var len = vList.length;
			for (var i = 0;i < len;i++) {
				light.applyOnVertex(vList[i]);
			}
		},
		
		capColorValue: function(vList) {
			var len = vList.length;
			for (var i = 0;i < len;i++) {
				var c = vList[i].color;
				if (c.r < 0){c.r = 0;} else if (c.r > 255){c.r = 255;}
				if (c.g < 0){c.g = 0;} else if (c.g > 255){c.g = 255;}
				if (c.b < 0){c.b = 0;} else if (c.b > 255){c.b = 255;}
			}
		},
		
		applyViewportTransform: function(vertices) {
			var vp = this.viewport;
			var len = vertices.length;
			for (var i = 0;i < len;i++) {
				var v = vertices[i].position;
				v.x *= vp.scaleX;
				v.y *= vp.scaleY;
				v.x += vp.centerX;
				v.y += vp.centerY;
			}
		},
		
		updateTransforms: function() {
			this.combinedTransforms.worldView.mul(this.viewTransform, this.worldTransform);
			this.combinedTransforms.worldViewProjection.mul(this.projectionTransform, this.combinedTransforms.worldView);
		}
	};
	
	
	function DirectionalLight() {
		this.direction = new smallworld3d.geometry.Vec4(0, -1, 0);
		this.enabled = true;
	}
	
	DirectionalLight.prototype = {
		applyOnVertex: function(v) {
			if (!this.enabled) {
				return;
			}
			
			var c = v.color;
			var dp = 0.5 - this.direction.dp3(v.N) * 0.5;

			c.r *= dp;
			c.g *= dp;
			c.b *= dp;
		}
	};
	
	pkg.DirectionalLight = DirectionalLight;
	pkg.RenderingContext = RenderingContext;
})(window.smallworld3d);