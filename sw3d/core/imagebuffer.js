if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function ImageBuffer(w, h, withZBuffer) {
		this.width  = w;
		this.height = h;
		
		// Allocate buffers
		this.color = this.allocateBuffer(w, h, 'color');
		this.z = withZBuffer ? this.allocateBuffer(w, h, 'depth') : null;
	}
	
	ImageBuffer.prototype = {
		allocateBuffer: function(w, h, bufferType) {
			if (bufferType == 'depth') {
				return new Float64Array(w*h);
			} else {
				return new Uint8Array(w*4 *h);
			}
		},

		clearColor: function(r, g, b) {
			var buf = this.color;
			var pos = 0;
			var len = this.width * this.height;
			for (var i = 0;i < len;i++) {
				buf[pos++] = r;
				buf[pos++] = g;
				buf[pos++] = b;
				buf[pos++] = 255;
			}
		},
		
		clearZ: function(z) {
			var buf = this.z;
			var len = this.width * this.height;
			for (var i = 0;i < len;i++) {
				buf[i] = z;
			}
		},

		emitToCanvas: function(context2d) {
			var w = this.width;
			var h = this.height;
			
			var imageData = context2d.getImageData(0, 0, w, h);
			var dest = imageData.data;
			var source = this.color;
			var pos = 0;
			
			var len = w * h;
			
			for (var i = 0;i < len;++i) {
				dest[pos]   = source[pos++];
				dest[pos]   = source[pos++];
				dest[pos]   = source[pos++];
				dest[pos++] = 255;
			}
			
			context2d.putImageData(imageData, 0, 0);
		}
	};
	
	pkg.ImageBuffer = ImageBuffer;
})(window.smallworld3d);
