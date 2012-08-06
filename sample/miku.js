(function(){
	var theViewer = null;
	var SCREEN_WIDTH  = 300;
	var SCREEN_HEIGHT = 300;
	
	window.launch = function() {
		var shcoeffs = null;
		
		if (window.PRTData) {
			shcoeffs = decodeSHCoefficients(PRTData);
		}
		
		var textureLoader = new smallworld3d.CanvasTextureLoader(MIKU_MODEL_SOURCE.texture_data, function(texBuffer) {
			theViewer = new Viewer(document.getElementById("render-target"));
			theViewer.buildMesh(MIKU_MODEL_SOURCE, texBuffer, true, shcoeffs);
			if (shcoeffs) {
				theViewer.context.customVertexShader = SHPRTVertexShader;
			}
		
			theViewer.observeMouse(document.body.parentNode);
		
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
		
		this.viewIsMoving = false;
		this.canvas = targetCanvas;
		this.canvas.width  = SCREEN_WIDTH;
		this.canvas.height = SCREEN_HEIGHT;
		this.g = this.canvas.getContext('2d');

		this.context = new smallworld3d.RenderingContext(SCREEN_WIDTH, SCREEN_HEIGHT);
		this.mesh = null;

		var directionalLight = new smallworld3d.DirectionalLight();
		directionalLight.direction.x = 2;
		directionalLight.direction.z = -2.5;
		directionalLight.direction.normalize3();
		this.context.addLight(directionalLight);
		this.directionalLight = directionalLight;

		this.context.projectionTransform.perspectiveFOV(Math.PI/3.0, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 30);
		this.context.viewTransform.translate(0, -6, -12);
		
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
			this.rotation.toX = -0.2 + y;
			
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
			
			this.render();
			
			if (this.viewIsMoving) {
				var _this = this;
				setTimeout(function(){_this.moveView();}, 10);
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
			var clearIntensity = 190;
			if (this.context.customVertexShader) {
				this.setupSHPRT();
				clearIntensity = 100;
			}

			this.context.imageBuffer.clearZ(1);
			this.context.imageBuffer.clearColor(clearIntensity, clearIntensity, clearIntensity);
			
			this.rotation.mX.rotationX(this.rotation.x);
			this.rotation.mY.rotationY(this.rotation.y);
			
			this.context.worldTransform.mul(this.rotation.mX, this.rotation.mY);
			this.mesh.doTransform(this.context);
			
			this.mesh.drawSubset(this.context, 0);
			this.mesh.drawSubset(this.context, 1);
			
			this.context.imageBuffer.emitToCanvas(this.g);
		},
		
		setupSHPRT: function() {
			var L = this.directionalLight.direction;
			var theta = -Math.acos(L.z);
			var phi = Math.atan(L.y / L.x);
			
			var coeffs = smallworld3d.SphericalHarmonics.projectVector(9, theta, phi, 0.49, 5, this.context.lightSHCoefficients);
			this.context.lightSHCoefficients = coeffs;
		}
		
	};
	
	function SHPRTVertexShader(renderingContext, v_out, v_in) {
		var mAll = renderingContext.combinedTransforms.worldViewProjection;
		var mRot = renderingContext.worldTransform;

		var p_in = v_in.position;
		var n_in = v_in.N;
		var p_out = v_out.position;
	
		mAll.transformVec3(p_out, p_in.x, p_in.y, p_in.z);
		mRot.transformVec3WithoutTranslation(v_out.N, n_in.x, n_in.y, n_in.z);
		v_out.N.normalize3();
	
		var shdotR = smallworld3d.SHCoefficients.dot(renderingContext.lightSHCoefficients, v_in.shCoefficients.R);
		var shdotG = smallworld3d.SHCoefficients.dot(renderingContext.lightSHCoefficients, v_in.shCoefficients.G);
		var shdotB = smallworld3d.SHCoefficients.dot(renderingContext.lightSHCoefficients, v_in.shCoefficients.B);

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
})();