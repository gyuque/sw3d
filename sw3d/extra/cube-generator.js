if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function generateCube(xSize, ySize, zSize, xDivs, yDivs, zDivs) {
		var undef = void 0;
		
		var vertexBuffer = [];
		var indexBuffer = [];
		
		// Default values
		if (xSize === undef) { xSize = 1; }
		if (ySize === undef) { ySize = 1; }
		if (zSize === undef) { zSize = 1; }
		if (xDivs === undef) { xDivs = 1; }
		if (yDivs === undef) { yDivs = 1; }
		if (zDivs === undef) { zDivs = 1; }
		
		if (xDivs > 999 || yDivs > 999 || zDivs > 999) {
			throw "Divisions must not over 999";
		}
		
		var xNumPoints = xDivs + 1;
		var yNumPoints = yDivs + 1;
		var zNumPoints = zDivs + 1;
		var vmapFront = buildXYFace(xNumPoints, yNumPoints, 'x', 'y', 'z', 0, false);
		var vmapBack  = buildXYFace(xNumPoints, yNumPoints, 'x', 'y', 'z', zNumPoints - 1, true);
		var vmapRight = buildXYFace(zNumPoints, yNumPoints, 'z', 'y', 'x', xNumPoints - 1, false);
		var vmapLeft  = buildXYFace(zNumPoints, yNumPoints, 'z', 'y', 'x', 0, true);
		var vmapTop   = buildXYFace(xNumPoints, zNumPoints, 'x', 'z', 'y', 0, true);
		var vmapBottom= buildXYFace(xNumPoints, zNumPoints, 'x', 'z', 'y', yNumPoints - 1, false);

		vmapFront.generateVertices(vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs);
		vmapBack.generateVertices(vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs);
		vmapRight.generateVertices(vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs);
		vmapLeft.generateVertices(vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs);
		vmapTop.generateVertices(vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs);
		vmapBottom.generateVertices(vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs);
		
		return {
			vertices: vertexBuffer,
			indices: indexBuffer
		};
	}
	
	function buildXYFace(cols, rows, colAxis, rowAxis, planeAxis, planePosition, reverseFace) {
		var vertexMap = new VertexMap();
		var i, j;

		var indexOrigins = {
			x: 0, y: 0, z: 0
		};

		var indices = {
			x: 0, y: 0, z: 0
		};

		var nextIndices = {
			x: 0, y: 0, z: 0
		};
		
		indices[planeAxis] = planePosition;

		indices[rowAxis] = indexOrigins[rowAxis];
		for (j = 0;j < (rows-1);j++) {
			indices[colAxis] = indexOrigins[colAxis];
			for (i = 0;i < (cols-1);i++) {
				nextIndices.x = indices.x;
				nextIndices.y = indices.y;
				nextIndices.z = indices.z;
				nextIndices[colAxis] += 1;
				nextIndices[rowAxis] += 1;
				
				var vertexIndex1, vertexIndex2, vertexIndex3, vertexIndex4;
				if (planeAxis == 'y') {
					vertexIndex1 = vertexMap.requestIndex(indices.x    , indices.y, indices.z    );
					vertexIndex2 = vertexMap.requestIndex(nextIndices.x, indices.y, indices.z    );
					vertexIndex3 = vertexMap.requestIndex(indices.x    , indices.y, nextIndices.z);
					vertexIndex4 = vertexMap.requestIndex(nextIndices.x, indices.y, nextIndices.z);
				} else {
					vertexIndex1 = vertexMap.requestIndex(indices.x    , indices.y    , indices.z    );
					vertexIndex2 = vertexMap.requestIndex(nextIndices.x, indices.y    , nextIndices.z);
					vertexIndex3 = vertexMap.requestIndex(indices.x    , nextIndices.y, indices.z    );
					vertexIndex4 = vertexMap.requestIndex(nextIndices.x, nextIndices.y, nextIndices.z);
				}
				//console.log(vertexIndex1, vertexIndex2, vertexIndex3, vertexIndex4)
				/*
				console.log(
					vertexMap.xOfIndex(vertexIndex1), vertexMap.yOfIndex(vertexIndex1), '',
					vertexMap.xOfIndex(vertexIndex2), vertexMap.yOfIndex(vertexIndex2), '',
					vertexMap.xOfIndex(vertexIndex3), vertexMap.yOfIndex(vertexIndex3), '',
					vertexMap.xOfIndex(vertexIndex4), vertexMap.yOfIndex(vertexIndex4));
				*/
				
				if (!reverseFace) {
					vertexMap.faceIndices.push(vertexIndex1, vertexIndex2, vertexIndex3);
					vertexMap.faceIndices.push(vertexIndex3, vertexIndex2, vertexIndex4);
				} else {
					vertexMap.faceIndices.push(vertexIndex2, vertexIndex1, vertexIndex4);
					vertexMap.faceIndices.push(vertexIndex4, vertexIndex1, vertexIndex3);
				}
				
				indices[colAxis] += 1;
			}
			indices[rowAxis] += 1;
		}
		
		return vertexMap;
	}
	
	// ------------------------------------
	
	function VertexMap() {
		this.map = {};
		this.list = [];
		this.faceIndices = [];
	}
	
	VertexMap.prototype = {
		requestIndex: function(ix, iy, iz) {
			var k = this.makeKey(ix, iy, iz);
			if (!this.map.hasOwnProperty(k)) {
				var nextIndex = this.list.length;
				this.map[k] = nextIndex;
				this.list.push(k);
			}
			
			return this.map[k];
		},
		
		xOfIndex: function(i) {
			var k = this.list[i];
			return k % 1000;
		},

		yOfIndex: function(i) {
			var k = this.list[i];
			return Math.floor(k / 1000) % 1000;
		},

		zOfIndex: function(i) {
			var k = this.list[i];
			return Math.floor(k / 1000000) % 1000;
		},
		
		makeKey: function(ix, iy, iz) {
			return ix + (iy * 1000) + (iz * 1000000);
		},
		
		generateVertices: function(vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs) {
			var vertexIndexOrigin = vertexBuffer.length;
			var vlen = this.list.length;
			var i;
			
			for (i = 0;i < vlen;i++) {
				var v = this.generateVertex(i, xSize, ySize, zSize, xDivs, yDivs, zDivs);
				vertexBuffer.push(v);
			}
			
			var ilen = this.faceIndices.length;
			for (i = 0;i < ilen;i++) {
				indexBuffer.push(this.faceIndices[i] + vertexIndexOrigin);
			}
		},
		
		generateVertex: function(index, xSize, ySize, zSize, xDivs, yDivs, zDivs) {
			var ix = this.xOfIndex(index);
			var iy = this.yOfIndex(index);
			var iz = this.zOfIndex(index);
			
			var xOrigin = -xSize * 0.5;
			var yOrigin =  ySize * 0.5;
			var zOrigin =  zSize * 0.5;
			
			var xStep =  xSize / xDivs;
			var yStep = -ySize / yDivs;
			var zStep = -zSize / zDivs;
			
			var v = new smallworld3d.Vertex3D();
			v.position.x = xOrigin + xStep*ix;
			v.position.y = yOrigin + yStep*iy;
			v.position.z = zOrigin + zStep*iz;
			
			return v;
		}
	};
	
	pkg.generateCube = generateCube;
})(window.smallworld3d);