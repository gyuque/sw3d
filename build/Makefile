CC = java -jar ~/devel/Closure/compiler.jar

INFILES = \
	../sw3d/core/types.js \
	../sw3d/core/imagebuffer.js \
	../sw3d/core/geometry-core.js \
	../sw3d/core/nearest-texture-sampler.js \
	../sw3d/core/rasterizer.js \
	../sw3d/core/rendering-context.js \
	../sw3d/basic/canvas-texture-loader.js \
	../sw3d/basic/geometry-basic.js \
	../sw3d/basic/mesh.js

INFILES_EXTRA = \
	../sw3d/extra/base64.js \
	../sw3d/extra/quaternion.js \
	../sw3d/extra/cube-generator.js \
	../sw3d/extra/pmd-bone.js \
	../sw3d/extra/pmd-motion.js \
	../sw3d/extra/spherical-harmonics.js \
	../sw3d/extra/sample-textures.js

all: sw3d-basic.js sw3d-all.js

sw3d-basic.js:
	$(CC) --js=$(INFILES) --js_output_file sw3d-basic.js

sw3d-all.js:
	$(CC) --js=$(INFILES) $(INFILES_EXTRA) --js_output_file sw3d-all.js	

.PHONY: clean
clean:
	rm -f sw3d-basic.js
	rm -f sw3d-all.js