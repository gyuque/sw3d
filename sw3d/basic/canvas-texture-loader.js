if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function CanvasTextureLoader(sourceURL, callback) {
		this.callback = callback;
		this.img = new Image();
		this.canvas = null;
		
		var _this = this;
		this.img.onload = function() { _this.onImageLoad(); };
		this.img.src = sourceURL;
	}
	
	CanvasTextureLoader.prototype = {
		onImageLoad: function() {
			if (this.callback) {
				this.callback( this.copyImage() );
			}
		},
		
		copyImage: function() {
			var img = this.img;
			this.canvas = document.createElement("canvas");
			
			var w = img.width;
			var h = img.height;
			this.canvas.width  = w;
			this.canvas.height = h;
			
			var g = this.canvas.getContext("2d");
			g.drawImage(img, 0, 0);
			var imageData = g.getImageData(0, 0, w, h);
			var sourcePixels = imageData.data;
			
			var texBuffer = new smallworld3d.ImageBuffer(w, h, false);
			var destPixels = texBuffer.color;
			
			var pos = 0;
			for (var y = 0;y < h;y++) {
				for (var x = 0;x < w;x++) {
					destPixels[pos] = sourcePixels[pos++];
					destPixels[pos] = sourcePixels[pos++];
					destPixels[pos] = sourcePixels[pos++];
					destPixels[pos] = sourcePixels[pos++];
				}
			}
			
			return texBuffer;
		}
	};
	
	pkg.CanvasTextureLoader = CanvasTextureLoader;
})(window.smallworld3d);