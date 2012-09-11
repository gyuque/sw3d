(function(){
	var gUsePRT = false;
	var gUseShadowMap = !!window.SHADOW_MAP_DEMO;
	var gUseSketchRendering = !!window.SKETCH_DEMO;
	var gLightSwitcher = null;
	var theViewer = null;
	var SCREEN_WIDTH  = 300;
	var SCREEN_HEIGHT = 300;
	var gShadowPreviewCanvasContext = null;
	var gSketchTextureBuffer = null;
	var gMotionManager = null;
	
	window.launch = function() {
		if (window.MotionManager) {
			gMotionManager = new MotionManager(MIKU_MODEL_SOURCE.bones, MIKU_MODEL_SOURCE.ik_list);
		}
		
		var tex = window.SKETCH_TEXTURE_DATA;
		if (!tex) {
			launch2();
		} else {
			var textureLoader = new smallworld3d.CanvasTextureLoader(tex, function(texBuffer) {
				gSketchTextureBuffer = texBuffer;
				launch2();
			});
		}
	};
	
	var launch2 = function() {
		var shcoeffs = null;
		
		if (window.PRTData) {
			gUsePRT = true;
			shcoeffs = decodeSHCoefficients(PRTData);
		}
		
		if (gUseShadowMap) {
			var cv_s = document.getElementById("shadow-preview");
			if (cv_s) {
				cv_s.width = SCREEN_WIDTH;
				cv_s.height = SCREEN_HEIGHT;
				gShadowPreviewCanvasContext = cv_s.getContext("2d");
			}
		}
		
		var textureLoader = new smallworld3d.CanvasTextureLoader(MIKU_MODEL_SOURCE.texture_data, function(texBuffer) {
			theViewer = new Viewer(document.getElementById("render-target"));
			
			theViewer.buildMesh(MIKU_MODEL_SOURCE, texBuffer, true, shcoeffs);
			if (gUsePRT) {
				theViewer.context.technique = {
					setupTransform: SHPRTSetup,
					vertexShader: SHPRTVertexShader
				};
			}
		
			theViewer.observeMouse(document.body.parentNode);
			
			if (gUsePRT) {
				gLightSwitcher = new LightSwitcher(["btn-light1", "btn-light2", "btn-light3"], function(){
					var selectedLight = gLightSwitcher.list[gLightSwitcher.selectedIndex];
					theViewer.setLightDirection(selectedLight.direction);
				});
				gLightSwitcher.setLightDirection(0,  2, -1, -1, 6);
				gLightSwitcher.setLightDirection(1, -.5, -2, -1, 4);
				gLightSwitcher.setLightDirection(2, -1, -0.2, 0.6, 10);
				gLightSwitcher.selectIndex(0);
			}
			
			if (gMotionManager) {
				gMotionManager.observeInputEvent(document.body);
				gMotionManager.renderer = theViewer;
				gMotionManager.showPoseOfFrame(0);
			}
			theViewer.render();
		});
	};

	function Viewer(targetCanvas) {
		this.rotation = {
			y: 0,
			x: 0,
			toY: 0,
			toX: 0,
			mX: new smallworld3d.geometry.M44(),
			mY: new smallworld3d.geometry.M44()
		};
		
		this.toLightDirection = new smallworld3d.geometry.Vec4();
		this.lightMoveVec = new smallworld3d.geometry.Vec4();
		this.viewIsMoving = false;
		this.canvas = targetCanvas;
		this.canvas.width  = SCREEN_WIDTH;
		this.canvas.height = SCREEN_HEIGHT;
		this.g = this.canvas.getContext('2d');

		this.context = new smallworld3d.RenderingContext(SCREEN_WIDTH, SCREEN_HEIGHT);
		this.mesh = null;

		var directionalLight = new smallworld3d.DirectionalLight();
		directionalLight.direction.x = 2;
		directionalLight.direction.y = -1;
		directionalLight.direction.z = -1;
		directionalLight.direction.normalize3();
		this.context.addLight(directionalLight);
		this.directionalLight = directionalLight;
		this.toLightDirection.copyFrom(directionalLight.direction);

		this.context.projectionTransform.perspectiveFOV(Math.PI/3.0, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 30);
		this.context.viewTransform.translate(0, -6, gUsePRT ? -20 : -13);
		
		directionalLight.enabled = false;
	}
	
	Viewer.prototype = {
		observeMouse: function(target) {
			var _this = this;
			target.addEventListener("mousemove", function(e) {
				_this.onMouseMove(e);
			}, false);
		},
		
		onMouseMove: function(e) {
			var x = (e.clientX + 100) * 0.01;
			var y = (e.clientY - 100) * 0.002;
			this.rotation.toY = x;
			this.rotation.toX = (gUsePRT ? 0 : -0.2) + y;
			
			if (!this.viewIsMoving) {
				this.moveView();
			}
		},
		
		setLightDirection: function(v) {
			this.toLightDirection.copyFrom(v);
			if (!this.viewIsMoving) {
				this.moveView();
			}
		},
		
		moveView: function() {
			var e = 0.001;
			var dx = this.rotation.toX - this.rotation.x;
			var dy = this.rotation.toY - this.rotation.y;
			this.viewIsMoving = false;
			
			if (dx < -e || dx > e) {
				dx *= 0.7;
				this.viewIsMoving = true;
			}

			if (dy < -e || dy > e) {
				dy *= 0.7;
				this.viewIsMoving = true;
			}
			
			this.rotation.x += dx;
			this.rotation.y += dy;
			
			if (this.moveLight()) {
				this.viewIsMoving = true;
			}
			
			if (!gMotionManager || !gMotionManager.nowPlaying) {
				this.render();
			}
			
			if (this.viewIsMoving) {
				var _this = this;
				setTimeout(function(){_this.moveView();}, 10);
			}
		},
		
		moveLight: function() {
			this.lightMoveVec.copyFrom(this.toLightDirection).sub(this.directionalLight.direction);
			var len = this.lightMoveVec.norm3();
			if (len < 0.01) {
				this.directionalLight.direction.copyFrom(this.toLightDirection);
				return false;
			} else {
				this.lightMoveVec.mul(0.3);
				this.directionalLight.direction.add(this.lightMoveVec);
				this.directionalLight.direction.w = this.directionalLight.direction.w * 0.4 + this.toLightDirection.w * 0.6;
				return true;
			}
		},
		
		buildMesh: function(source, textureBuffer, invertZ, shCoefficients)  {
			var mesh = new smallworld3d.Mesh();
			var faceColor = new smallworld3d.RGBAColor(255, 255, 255, 255);
			
			var i;
			var vlist = source.vertices;
			var vlen = vlist.length;
			
			for (i = 0;i < vlen;i++) {
				var vSource = vlist[i];
				var v = new smallworld3d.Vertex3D();
				v.position.x = vSource.p[0];
				v.position.y = vSource.p[1];
				v.position.z = vSource.p[2];
				
				v.N.x = vSource.n[0];
				v.N.y = vSource.n[1];
				v.N.z = vSource.n[2];
				
				v.color.r = faceColor.r;
				v.color.g = faceColor.g;
				v.color.b = faceColor.b;
				v.color.a = faceColor.a;
				
				if (shCoefficients) {
					v.shCoefficients = shCoefficients[i];
				}
				
				// Invert Z for DirectX mesh data
				if (invertZ) {
					v.position.z *= -1;
					v.N.z *= -1;
				}

				if (vSource.uv) {
					v.textureUV.u = vSource.uv[0];
					v.textureUV.v = vSource.uv[1];
				}
				
				if (gMotionManager) {
					gMotionManager.prepareVertex(v, vSource.b);
				}

				mesh.addVertex(v);
			}
			
			var ilist = source.triangles;
			var ilen = ilist.length / 3;

			for (i = 0;i < ilen;i++) {
				mesh.addTriangle(ilist[i*3], ilist[i*3+1], ilist[i*3+2]);
			}
			
			for (i in source.groups) {
				mesh.addTriangleGroup(source.groups[i]);
			}
			
			mesh.setGroupMaterial(0, new smallworld3d.TexturedMaterial(textureBuffer));
			this.mesh = mesh;
		},
		
		render: function() {
			if (gMotionManager) {
				gMotionManager.updateVertices(this.mesh.vertices);
			}
			
			this.rotation.mX.rotationX(this.rotation.x);
			this.rotation.mY.rotationY(this.rotation.y);
			this.context.worldTransform.mul(this.rotation.mX, this.rotation.mY);

			if (gUseShadowMap) {
				this.renderShadowTexture();
			}
			
			
			var clearIntensity = (gUsePRT || gUseShadowMap) ? 100 : gUseSketchRendering ? 255 : 190;
			this.context.imageBuffer.clearZ(1);
			this.context.imageBuffer.clearColor(clearIntensity, clearIntensity, clearIntensity);

			if (gUseSketchRendering) {
				// Configure technique
				SketchTechnique.updateViewportScale(this.context.viewport);
				SketchTechnique.setFillPattern(gSketchTextureBuffer);
				SketchTechnique.setLightDirection(this.context.lights[0].direction);
				
				this.context.technique = SketchTechnique.pass0;
			} else if (gMotionManager) {
				this.context.technique = SkinningMeshTechnique.pass0;
			}

			// ----------------------------------
			// Main pass
			this.context.beginPass();
			this.mesh.doTransform(this.context);
			
			this.mesh.drawSubset(this.context, 0);
			if (!gUseSketchRendering) {
				this.mesh.drawSubset(this.context, 1);
			}
			this.context.endPass();
			// ----------------------------------

			if (gUseShadowMap) {
				this.drawShadows();
			}

			if (gUseSketchRendering) {
				this.renderSketchContour();
			}

/*
			if (gMotionManager) {
				gMotionManager.drawDebugBones(this.context);
			}
*/
			this.context.imageBuffer.emitToCanvas(this.g);
		},

		renderSketchContour: function() {
			// Replace with sketch technique
			var oldTechnique = this.context.technique;
			this.context.technique = SketchTechnique.pass1;
			
			this.context.beginPass();
			this.mesh.doTransform(this.context);
			this.mesh.drawSubset(this.context, 0);
			this.context.endPass();

			// Restore saved technique
			this.context.technique = oldTechnique;
		},

		renderShadowTexture: function() {
			var L0 = this.context.lights[0].direction;
			ShadowMappingTechnique.setLightDirection(L0);
			
			// Replace with shadow mapping technique
			var oldTechnique = this.context.technique;
			this.context.technique = ShadowMappingTechnique.pass0;
			
			this.context.beginPass();
			this.context.imageBuffer.clearZ(1);
			this.context.imageBuffer.clearColor(0, 0, 0);
			this.mesh.doTransform(this.context);

			this.mesh.drawSubset(this.context, 0);
			this.mesh.drawSubset(this.context, 1);
			
			this.context.endPass();
			
			// Restore saved technique
			this.context.technique = oldTechnique;
			
			if (gShadowPreviewCanvasContext) {
				ShadowMappingTechnique.shadowTexture.emitToCanvas(gShadowPreviewCanvasContext);
			}
		},
		
		drawShadows: function() {
			// Replace with shadow mapping technique
			var oldTechnique = this.context.technique;
			this.context.technique = ShadowMappingTechnique.pass2;

			this.context.beginPass();
//			this.context.imageBuffer.clearZ(1);
			this.mesh.doTransform(this.context);

			this.mesh.drawSubset(this.context, 0);
			this.mesh.drawSubset(this.context, 1);

			this.context.endPass();

			// Restore saved technique
			this.context.technique = oldTechnique;
		}
	};
	
	var rotLVec = null;
	var invRot = null;
	var lightSHCoefficients;
	function SHPRTSetup(renderingContext) {
		if (!invRot) {
			invRot = new smallworld3d.geometry.M44();
			rotLVec = new smallworld3d.geometry.Vec4();
		}

		var mRot = renderingContext.worldTransform;
		var L0 = renderingContext.lights[0].direction;
		invRot.makeTransposed(mRot);
		invRot.transformVec3WithoutTranslation(rotLVec, L0.x, L0.y, L0.z);

		var theta = -Math.acos(rotLVec.z);
		var phi = Math.atan2(rotLVec.y, rotLVec.x);
		
		var coeffs = smallworld3d.SphericalHarmonics.projectVector(L0.w, theta, phi, 0.49, 5, lightSHCoefficients);
		coeffs.vector[0] += 1.5; // Ambient Light
		lightSHCoefficients = coeffs;
	}
	
	function SHPRTVertexShader(renderingContext, v_out, v_in) {
		var mAll = renderingContext.combinedTransforms.worldViewProjection;

		var p_in = v_in.position;
		var n_in = v_in.N;
		var p_out = v_out.position;
	
		mAll.transformVec3(p_out, p_in.x, p_in.y, p_in.z);
		//mRot.transformVec3WithoutTranslation(v_out.N, n_in.x, n_in.y, n_in.z);
		v_out.N.normalize3();
	
		var shdotR = smallworld3d.SHCoefficients.dot(lightSHCoefficients, v_in.shCoefficients.R);
		var shdotG = smallworld3d.SHCoefficients.dot(lightSHCoefficients, v_in.shCoefficients.G);
		var shdotB = smallworld3d.SHCoefficients.dot(lightSHCoefficients, v_in.shCoefficients.B);

		p_out.x /= p_out.w;
		p_out.y /= p_out.w;
		p_out.z /= p_out.w;
		var iR = shdotR*0.5 + 0.5;
		var iG = shdotG*0.5 + 0.5;
		var iB = shdotB*0.5 + 0.5;
	
		v_out.color.r = (v_in.color.r * iR) >> 0;
		v_out.color.g = (v_in.color.g * iG) >> 0;
		v_out.color.b = (v_in.color.b * iB) >> 0;
		v_out.color.a =  v_in.color.a;
		v_out.textureUV.u = v_in.textureUV.u;
		v_out.textureUV.v = v_in.textureUV.v;
	}

	function decodeSHCoefficients(list) {
		function decodeCoeffsString(b64s) {
			var C = smallworld3d.Base64.characters;
			function c2i(c) {return C.indexOf(c);}
			
			//SHCoefficients
			var nCoefficients = b64s.length / 3;
			var order = Math.sqrt(nCoefficients);
			var coeffsObj = new smallworld3d.SHCoefficients(order);
			
			var clist = coeffsObj.vector;
			for (var i = 0;i < nCoefficients;i++) {
				var i1 = c2i( b64s.charAt(i*3  ) );
				var i2 = c2i( b64s.charAt(i*3+1) );
				var i3 = c2i( b64s.charAt(i*3+2) );
				var coeff = ((i1 | (i2 << 6) | (i3 << 12)) - 50000) / 100000.0;
				clist[i] = coeff;
			}

			return coeffsObj;
		}
		
		var len = list.length / 3;
		var outList = [];
		for (var i = 0;i < len;i++) {
			var vertexCoeffs = {
				R: decodeCoeffsString(list[i*3  ]),
				G: decodeCoeffsString(list[i*3+1]),
				B: decodeCoeffsString(list[i*3+2])
			}
			
			outList.push(vertexCoeffs);
		}
		
		return outList;
	}
	
	function LightSwitcher(idList, callback) {
		var _this = this;
		this.list = [];
		this.selectedIndex = 0;
		this.callback = callback;
		
		function setHandler(target, index) {
			target.addEventListener("click", function(){_this.selectIndex(index);}, false);
		}
		
		for (var i = 0;i < idList.length;i++) {
			var btn = document.getElementById(idList[i]);
			this.list.push({
				index: i,
				button: btn
			})
			
			setHandler(btn, i);
		}
	}
	
	LightSwitcher.prototype = {
		reset: function() {
			for (var i = 0;i < this.list.length;i++) {
				this.list[i].button.disabled = false;
			}
		},
		
		setLightDirection: function(index, x, y, z, radiance) {
			this.list[index].direction = (new smallworld3d.geometry.Vec4(x, y, z, radiance)).normalize3();
		},
		
		selectIndex: function(index) {
			this.reset();
			
			var item = this.list[index];
			item.button.disabled = true;
			this.selectedIndex = index;
			if (this.callback) {
				this.callback(this);
			}
		}
	};
	
	// +------------------------------------------------------
	// | Shadow mapping technique
	// +------------------------------------------------------
	
	var ShadowMappingTechnique = (function() {
		var shadowTexture = new smallworld3d.ImageBuffer(SCREEN_WIDTH, SCREEN_HEIGHT, true);
		var lightDirection= new smallworld3d.geometry.Vec4(0, 0, 0);
		var lightPosition = new smallworld3d.geometry.Vec4(0, 0, 0);
		var lightTarget   = new smallworld3d.geometry.Vec4(0, 0, 0);
		var lightUp       = new smallworld3d.geometry.Vec4(0, 1, 0);
		var transformP0   = new smallworld3d.geometry.M44();
		var shaderTempV   = new smallworld3d.geometry.Vec4();

		var savedStates = {
			renderTarget: null,
			culling: 0,
			projectionTransform: new smallworld3d.geometry.M44(),
			viewTransform: new smallworld3d.geometry.M44()
		};
		
		var pass0 = {
			beginPass: function(renderingContext) {
				// Save states
				savedStates.renderTarget = renderingContext.replaceRenderTarget(shadowTexture);
				savedStates.viewTransform.copyFrom(renderingContext.viewTransform);
				savedStates.projectionTransform.copyFrom(renderingContext.projectionTransform);
				savedStates.culling = renderingContext.rasterizer.culling;
				
				// Setup special states for shadow texture
				renderingContext.viewTransform.lookAt(lightPosition, lightTarget, lightUp);
				renderingContext.projectionTransform.perspectiveFOV(Math.PI/2, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 28);
				renderingContext.rasterizer.culling = smallworld3d.Rasterizer.REVERSE_CULLING;
			},
		
			setupTransform: function(renderingContext) {
			//	console.log(renderingContext)
			//	throw 1;
				transformP0.copyFrom(renderingContext.combinedTransforms.worldViewProjection);
			},

			vertexShader: function(renderingContext, v_out, v_in) {
				var mAll = renderingContext.combinedTransforms.worldViewProjection;

				var p_in = v_in.position;
				var p_out = v_out.position;

				mAll.transformVec3(p_out, p_in.x, p_in.y, p_in.z);
				

				// Set NON w-divided positions 
				v_out.textureUV.u = p_out.z;
				v_out.textureUV.v = p_out.w;

				p_out.x /= p_out.w;
				p_out.y /= p_out.w;
				p_out.z /= p_out.w;
			},

			pixelShader: function(rasterizer, ps_out, ps_in) {
				var outColor = ps_out.color;

				ps_out.z = ps_in.tu / ps_in.tv;
				outColor.a = 0;
			},
			
			endPass: function(renderingContext) {
				// Restore states
				renderingContext.replaceRenderTarget(savedStates.renderTarget);
				renderingContext.viewTransform.copyFrom(savedStates.viewTransform);
				renderingContext.projectionTransform.copyFrom(savedStates.projectionTransform);
				renderingContext.rasterizer.culling = savedStates.culling;
			}
		};
		
		var kShadowAlpha = 90;
		var sampler, tex;
		var pass2 = {
			beginPass: function(renderingContext) {
				var r = renderingContext.rasterizer;
				tex = shadowTexture;
				sampler = r.textureSampler;
			},

			endPass: function(renderingContext) {
			},
			
			vertexShader: function(renderingContext, v_out, v_in) {
				var mAll = renderingContext.combinedTransforms.worldViewProjection;
				var mRot = renderingContext.worldTransform;

				var p_in = v_in.position;
				var p_out = v_out.position;
				var n_in = v_in.N;
				
				// Transform with current transform
				mAll.transformVec3(p_out, p_in.x, p_in.y, p_in.z);
				mRot.transformVec3WithoutTranslation(v_out.N, n_in.x, n_in.y, n_in.z);
				v_out.N.normalize3();
				
				p_out.x /= p_out.w;
				p_out.y /= p_out.w;
				p_out.z /= p_out.w;
				p_out.z -= 0.001;

				// Transform with matrices used in pass 0
				var tp = shaderTempV;
				transformP0.transformVec3(tp, p_in.x, p_in.y, p_in.z);
				tp.x /= tp.w;
				tp.y /= tp.w;

				tp.x = 0.5 + 0.5 * tp.x;
				tp.y = 0.5 - 0.5 * tp.y;

				var dp = lightDirection.dp3(v_out.N);
				var a = kShadowAlpha * (dp*1.3 + 1.3);
				if (a > kShadowAlpha) {a = kShadowAlpha;}
				v_out.color.a = a >> 0;
				
				v_out.textureUV.s = tp.z;
				v_out.textureUV.t = tp.w;
				v_out.textureUV.u = tp.x;
				v_out.textureUV.v = tp.y;
			},
			
			pixelShader: function(rasterizer, ps_out, ps_in) {
				var shadowDepth = sampler.getPixelDepth(tex, ps_in.tu, ps_in.tv) + 0.001;
				var targetDepth = ps_in.ts / ps_in.tt;
				var shadeA = ps_in.color.a;
				
				var a = (shadowDepth < targetDepth) ? kShadowAlpha : shadeA;
				
				var outColor = ps_out.color;
				outColor.r = 0;
				outColor.g = 0;
				outColor.b = 0;
				outColor.a = a;
			}
		};
		
		return {
			pass0: pass0,
			/* pass1 uses fixed pipeline */
			pass2: pass2,
			
			shadowTexture: shadowTexture,
			setLightDirection: function(d) {
				lightDirection.copyFrom(d);
				var distance = 18.0;
				lightPosition.x = d.x * -distance;
				lightPosition.y = d.y * -distance;
				lightPosition.z = d.z * -distance;
			}
		};
	})();
	
	// +------------------------------------------------------
	// | Sketch rendering technique
	// +------------------------------------------------------
	var SketchTechnique = (function() {
		var invViewportScale = 1;
		var fillPattern = null;
		var sampler;
		var lightDirection = new smallworld3d.geometry.Vec4(0, 0, 0);
		var texel = new smallworld3d.RGBAColor();
		
		var savedStates = {
			culling: 0
		};
		
		function updateViewportScale(v) {
			invViewportScale = 3.0 / -v.scaleY;
		}
		
		function setFillPattern(tex) {
			fillPattern = tex;
		}
		
		var pass0 = {
			beginPass: function(renderingContext) {
				sampler = renderingContext.rasterizer.textureSampler;
			},

			vertexShader: function(renderingContext, v_out, v_in) {
				var p_in = v_in.position;
				var p_out = v_out.position;
				var n_in = v_in.N;
				var n_out = v_out.N;
				
				var mAll = renderingContext.combinedTransforms.worldViewProjection;
				var mRot = renderingContext.combinedTransforms.worldView;
				mAll.transformVec3(p_out, p_in.x, p_in.y, p_in.z);
				mRot.transformVec3WithoutTranslation(n_out, n_in.x, n_in.y, n_in.z);

				p_out.x /= p_out.w;
				p_out.y /= p_out.w;
				p_out.z /= p_out.w;
				
				var dotLight = 0.5 - lightDirection.dp3(n_out) * 0.5;
				v_out.color.r = (dotLight * 255) >> 0;
				
				v_out.textureUV.u = v_in.textureUV.u;
				v_out.textureUV.v = v_in.textureUV.v;
				v_out.textureUV.s = 0.5 + 0.5 * p_out.x;
				v_out.textureUV.t = 0.5 - 0.5 * p_out.y;
			},

			pixelShader: function(rasterizer, ps_out, ps_in) {
				var inColor = ps_in.color;
				var highlight = inColor.r / 700;

				var outColor = ps_out.color;
				sampler.getPixel(inColor, rasterizer.texture, ps_in.tu, ps_in.tv);
					
				sampler.getPixel(texel, fillPattern, ps_in.ts, ps_in.tt);
				var a = (texel.r / 255.0) + highlight;
				if (a > 1.0){a = 1.0;}
				
				var ia = 1.0 - a;
				
				inColor.r >>= 5;
				inColor.g >>= 5;
				inColor.b >>= 5;
				inColor.r <<= 6;
				inColor.g <<= 6;
				inColor.b <<= 6;
				
				outColor.r = (inColor.r * ia + 255 * a) >> 0;
				outColor.g = (inColor.g * ia + 255 * a) >> 0;
				outColor.b = (inColor.b * ia + 255 * a) >> 0;
				
				if (outColor.r > 255) {outColor.r = 255;}
				if (outColor.g > 255) {outColor.g = 255;}
				if (outColor.b > 255) {outColor.b = 255;}
/*
				outColor.r = inColor.r ;
				outColor.g = inColor.g ;
				outColor.b = inColor.b ;
*/				
				
				outColor.a = 255;
			}
		};
		
		var pass1 = {
			beginPass: function(renderingContext) {
				// Save states
				savedStates.culling = renderingContext.rasterizer.culling;
				renderingContext.rasterizer.culling = smallworld3d.Rasterizer.REVERSE_CULLING;
			},

			endPass: function(renderingContext) {
				renderingContext.rasterizer.culling = savedStates.culling;
			},


			vertexShader: function(renderingContext, v_out, v_in) {
				var p_in = v_in.position;
				var p_out = v_out.position;
				var n_in = v_in.N;
				var n_out = v_out.N;
				
				var mAll = renderingContext.combinedTransforms.worldViewProjection;
				var mRot = renderingContext.combinedTransforms.worldView;
				var mP = renderingContext.projectionTransform;

				// Transform with current transform

				mAll.transformVec3(p_out, p_in.x, p_in.y, p_in.z);
				n_out.copyFrom(n_in);
				n_out.mul(invViewportScale / mP._11 * p_out.w);

				mAll.transformVec3(p_out, p_in.x + n_out.x, p_in.y + n_out.y, p_in.z + n_out.z);

				p_out.x /= p_out.w;
				p_out.y /= p_out.w;
				p_out.z /= p_out.w;

				v_out.textureUV.s = 0.5 + 0.5 * p_out.x;
				v_out.textureUV.t = 0.5 - 0.5 * p_out.y;
			},

			pixelShader: function(rasterizer, ps_out, ps_in) {
				var outColor = ps_out.color;
				sampler.getPixel(texel, fillPattern, 1.0 - ps_in.ts, 1.0 - ps_in.tt);
				var k = (texel.r * 0.7) >> 0;
				
				outColor.r = k;
				outColor.g = k;
				outColor.b = k;
				outColor.a = 255;
			}

		};

		return {
			pass0: pass0,
			pass1: pass1,
			setFillPattern: setFillPattern,
			updateViewportScale: updateViewportScale,
			setLightDirection: function(d) {
				lightDirection.copyFrom(d);
			}
		};
	})();
	
	// +------------------------------------------------------
	// | Skinning mesh technique
	// +------------------------------------------------------
	var SkinningMeshTechnique = (function() {
		var localTempPos = new smallworld3d.geometry.Vec4(0, 0, 0);
		
		return {
			pass0: {
				vertexShader: function(renderingContext, v_out, v_in) {
					var mAll = renderingContext.combinedTransforms.worldViewProjection;
					var p_in = v_in.position;
					var p_out = v_out.position;
					
					var bone = v_in.boneParams;
					if (bone) {
						v_in.skinningMatrix.transformVec3(localTempPos, p_in.x, p_in.y, p_in.z);
						mAll.transformVec3(p_out, localTempPos.x, localTempPos.y, localTempPos.z);
					} else {
						mAll.transformVec3(p_out, p_in.x, p_in.y, p_in.z);
					}
					
					p_out.x /= p_out.w;
					p_out.y /= p_out.w;
					p_out.z /= p_out.w;

					v_out.color.copyFrom(v_in.color);
					v_out.textureUV.u = v_in.textureUV.u;
					v_out.textureUV.v = v_in.textureUV.v;
				}
			}
		};
	})();

})();