var gl;

	function sphere2Cart(lat,lon,r) {
		var point = {};
		var phi = degToRad(lat);
		var theta = degToRad(90-lon);

		point.x = r*Math.sin(phi)*Math.cos(theta);
		point.y = r*Math.sin(phi)*Math.sin(theta);
		point.z = r*Math.cos(phi);
		return point;
	}



function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

/*      shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
*/
	shaderProgram.uColorAttribute = gl.getUniformLocation(shaderProgram, "uVertexColor");
    //gl.enableVertexAttribArray(shaderProgram.uColorAttribute);
	shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);


    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
	shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
}


var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

	var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}



var icoVertexPositionBuffer;
var icoVertexTextureCoordBuffer;
var icoNormalVectorBuffer;

var circVertexPositionBuffer;
var circVertexTextureCoordBuffer;
var circNormalVectorBuffer;

var mapVertexPositionBuffer;
var whiteTexture
var icoVertexIndexBuffer;
var vertices;

var midPointCache = {};
;
function getMiddlePoint(p0,p1) {
	if(p0 < p1 ) {
		key = p0+":"+p1;
	} else {
		key = p1+":"+p0;
	}
	ret = midPointCache[key];
	if(ret > 0) {
		return ret;
	} else {
		var p2 = {};
		
		p2.x = (vertices[p0*3] +vertices[p1*3] )/2;
		p2.y = (vertices[p0*3+1] +vertices[p1*3+1] )/2;
		p2.z = (vertices[p0*3+2] +vertices[p1*3+2] )/2;

		length = Math.sqrt(p2.x * p2.x + p2.y * p2.y + p2.z * p2.z);
		p2.x = p2.x/length;
		p2.y = p2.y/length;
		p2.z = p2.z/length;
		
		ret = vertices.length/3;
		vertices.push(p2.x);
		vertices.push(p2.y);
		vertices.push(p2.z);
		midPointCache[key]=ret;
		return ret;

	}
	
}

function initIcoSphereBuffer(recursion) {


	// http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html
	//t = 1.6180339887; // (1.0 + Math.Sqrt(5.0)) / 2.0;
	s = 1 / Math.sqrt(5); 
	t = 2 / Math.sqrt(5);

    vertices = [
        
        -s,    t,  0.0,
         s,    t,  0.0,
        -s,   -t,  0.0,
         s,   -t,  0.0,
	
         0.0, -s,    t,
         0.0,  s,    t,
         0.0, -s,   -t,
         0.0,  s,   -t,

        	
           t,  0.0, -s,
           t,  0.0,  s,
          -t,  0.0, -s,
          -t,  0.0,  s,

    ];
    
    var icoVertexIndices = [
		// 5 faces around point 0
        0, 11, 5,      
		0, 5, 1,   
        0, 1, 7,      
		0, 7, 10,    
        0, 10, 11,
		// 5 adjacent faces
		1, 5, 9,
		5, 11, 4,
		11, 10, 2,
		10, 7, 6,
		7, 1, 8,
		// 5 faces around point 3
		3, 9, 4,
		3, 4, 2,
		3, 2, 6,
		3, 6, 8,
		3, 8, 9,
		// 5 adjacent faces
		4, 9, 5,
		2, 4, 11,
		6, 2, 10,
		8, 6, 7,
		9, 8, 1,

    ];
	// split the triangles into 4 new ones.
	for ( k = 0 ; k < recursion ; k++) {
		var icoVertexIndices2 = [];	
		for(i=0; i<icoVertexIndices.length ; i+=3) {
			v0 = icoVertexIndices[i];
			v1 = icoVertexIndices[i+1];
			v2 = icoVertexIndices[i+2];

			a = getMiddlePoint(v0,v1);
			b = getMiddlePoint(v1,v2);
			c = getMiddlePoint(v2,v0);

			icoVertexIndices2[i*4+0] = v0 ;
			icoVertexIndices2[i*4+1] = a ;
			icoVertexIndices2[i*4+2] = c ;

			icoVertexIndices2[i*4+3] = v1 ;
			icoVertexIndices2[i*4+4] = b ;
			icoVertexIndices2[i*4+5] = a ;

			icoVertexIndices2[i*4+6] = v2 ;
			icoVertexIndices2[i*4+7] = c ;
			icoVertexIndices2[i*4+8] = b ;

			icoVertexIndices2[i*4+9] = a ;
			icoVertexIndices2[i*4+10] = b ;
			icoVertexIndices2[i*4+11] = c ;

		}

		icoVertexIndices = icoVertexIndices2;
	}
	icoVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, icoVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    icoVertexPositionBuffer.itemSize = 3;
    icoVertexPositionBuffer.numItems = vertices.length/3;

	var textureCoords = [];
	var normalVect = [];
	for(i=0;i<vertices.length/3;i++) {
		textureCoords[2*i] = 0;
		textureCoords[2*i+1] = 0;
		v1 = vec3.normalize([vertices[3*i],vertices[3*i+1],vertices[3*i+2]]);
		normalVect[3*i+0]=v1[0];
		normalVect[3*i+1]=v1[1];
		normalVect[3*i+2]=v1[2];
	}
	icoVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, icoVertexTextureCoordBuffer);
 	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    icoVertexTextureCoordBuffer.itemSize = 2;
    icoVertexTextureCoordBuffer.numItems = textureCoords.length/2;

	icoNormalVectorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,icoNormalVectorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVect), gl.STATIC_DRAW);
	icoNormalVectorBuffer.itemSize=3;
	icoNormalVectorBuffer.numItems=normalVect.length/3;
	

    icoVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, icoVertexIndexBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(icoVertexIndices), gl.STATIC_DRAW);
    icoVertexIndexBuffer.itemSize = 1;
    icoVertexIndexBuffer.numItems = icoVertexIndices.length;

	whiteTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
	var whitePixel = new Uint8Array([255, 255, 255, 255]);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, 
		          gl.RGBA, gl.UNSIGNED_BYTE, whitePixel);
}

function initCircleBuffer(parts) {
	var circVert = [];
	var textureCoords = [];
	for(i=0 ; i<parts ; i++) {
		circVert[3*i + 0] = Math.sin(2.0*i*Math.PI/parts);
		circVert[3*i + 1] = Math.cos(2.0*i*Math.PI/parts);
		circVert[3*i + 2] = 0;
		textureCoords[2*i] = 0;
		textureCoords[2*i+1] = 0;	
	}
	circVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,circVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circVert),gl.STATIC_DRAW);
	circVertexPositionBuffer.itemSize = 3;
	circVertexPositionBuffer.numItems = parts;

	circNormalVectorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,circNormalVectorBuffer);
	// circVert is already normalized, might be possible to use the same buffer ?
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circVert), gl.STATIC_DRAW);
	circNormalVectorBuffer.itemSize=3;
	circNormalVectorBuffer.numItems=circVert.length/3;


	circVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circVertexTextureCoordBuffer);
 	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    circVertexTextureCoordBuffer.itemSize = 2;
    circVertexTextureCoordBuffer.numItems = textureCoords.length/2;
}

function initMapBuffer() {
	/*var depth = 6705;
	p1 = sphere2Cart(65.5,-18.52,depth);
	p2 = sphere2Cart(63.8,-18.55,depth);
	p3 = sphere2Cart(65.45 ,-14.8,depth);
	p4 = sphere2Cart(63.75,-15.08,depth);
	vertices = [
	     p3.x,  p3.y,  p3.z,
         p4.x,  p4.y,  p4.z,
         p1.x,  p1.y,  p1.z,
         p2.x,  p2.y,  p2.z
	];
*/
	mapVertexPositionBuffer = gl.createBuffer();
	/*gl.bindBuffer(gl.ARRAY_BUFFER,mapVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),gl.STATIC_DRAW);*/
	mapVertexPositionBuffer.itemSize = 3;
	mapVertexPositionBuffer.numItems = 4;
	mapVertexTextureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexTextureCoordBuffer);
        var textureCoords = [
            1.0, 1.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 0.0];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    mapVertexTextureCoordBuffer.itemSize = 2;
    mapVertexTextureCoordBuffer.numItems = 4;
	var normalVect = [];
	for(i=0;i<vertices.length/3;i++) {
		v1 = vec3.normalize([vertices[3*i],vertices[3*i+1],vertices[3*i+2]]);
		normalVect[3*i+0]=v1[0];
		normalVect[3*i+1]=v1[1];
		normalVect[3*i+2]=v1[2];
	}
	mapNormalVectorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,mapNormalVectorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalVect), gl.STATIC_DRAW);
	mapNormalVectorBuffer.itemSize=3;
	mapNormalVectorBuffer.numItems=normalVect.length/3;


}
function setLighting() {
	gl.uniform1i(shaderProgram.useLightingUniform, 1);

	gl.uniform3f(
		shaderProgram.ambientColorUniform,
		0.4, 0.4, 0.4 
	);
	var lightingDirection = [ 0.0 , -1.0, 1.0 ];
	var adjustedLD = vec3.create();
	vec3.normalize(lightingDirection, adjustedLD);
	//vec3.scale(adjustedLD, 1);
	gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

	gl.uniform3f(
		shaderProgram.directionalColorUniform,
		0.8,0.8,0.8
    );	
};


function drawSphere(pos,sz,color)
{
	mvPushMatrix();

	//sz=20;
	/*mat4.translate(mvMatrix, [q.latitude, q.longitude, -q.depth/2]);*/
	mat4.translate(mvMatrix, [pos.x, pos.y, pos.z]);

	mat4.scale(mvMatrix, [ sz,sz,sz ]);

	gl.bindBuffer(gl.ARRAY_BUFFER, icoVertexPositionBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, icoVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, icoNormalVectorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, icoNormalVectorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	gl.bindBuffer(gl.ARRAY_BUFFER, icoVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, icoVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
		
	gl.uniform4f(shaderProgram.uColorAttribute, color[0],color[1],color[2],color[3]);
	gl.bindTexture(gl.TEXTURE_2D, whiteTexture); 

	setMatrixUniforms();

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, icoVertexIndexBuffer);
	gl.drawElements(gl.TRIANGLES, icoVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);



	mvPopMatrix();
}

function drawEarthWF(pos,radius)
{
    // draw earth wireframe
	mvPushMatrix();
	mat4.translate(mvMatrix, [pos.x, pos.y, pos.z]);
	mat4.rotate(mvMatrix,Math.PI/2.0,[0,1,0]);
	mat4.scale(mvMatrix,[radius,radius,radius]);
	gl.bindBuffer(gl.ARRAY_BUFFER, circVertexPositionBuffer)
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, circVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, circNormalVectorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, circNormalVectorBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ARRAY_BUFFER, circVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, circVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindTexture(gl.TEXTURE_2D, whiteTexture); 

	// draw longtitutes
	for( lon  = 0; lon < 180 ; lon ++) {
		mvPushMatrix();

		mat4.rotate(mvMatrix,lon*Math.PI/180,[1,0,0]);

		gl.uniform4fv(shaderProgram.uColorAttribute, [1.0, 0, 1.0, 1.0]);
		setMatrixUniforms();
		
		gl.drawArrays(gl.LINE_LOOP, 0, circVertexPositionBuffer.numItems);

		mvPopMatrix();
	
	} 
	mvPopMatrix();

	for( lat = -90; lat < 90; lat ++) {
		mvPushMatrix();
		var sz = radius*Math.cos(lat*Math.PI/180);

		mat4.translate(mvMatrix, [pos.x, pos.y, pos.z+radius*Math.sin(lat*Math.PI/180)]);
		mat4.scale(mvMatrix,[sz,sz,sz]);

		gl.uniform4fv(shaderProgram.uColorAttribute, [1.0, 1.0, 0, 1.0]);
		setMatrixUniforms();
		gl.drawArrays(gl.LINE_LOOP, 0, circVertexPositionBuffer.numItems);		
		mvPopMatrix();
	}
	
}

function drawMap(depth) 
{
		
	var depth = 6731-depth;
	p1 = sphere2Cart(65.515,-18.52,depth);
	p2 = sphere2Cart(63.8,-18.55,depth);
	p3 = sphere2Cart(65.45 ,-14.8,depth);
	p4 = sphere2Cart(63.75,-15.04,depth);
	vertices = [
	     p3.x,  p3.y,  p3.z,
         p4.x,  p4.y,  p4.z,
         p1.x,  p1.y,  p1.z,
         p2.x,  p2.y,  p2.z
	];

	gl.bindBuffer(gl.ARRAY_BUFFER,mapVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),gl.STATIC_DRAW);
	mapVertexPositionBuffer.itemSize = 3;
	mapVertexPositionBuffer.numItems = 4;

	mvPushMatrix();
	//mat4.translate(mvMatrix, [center.x, center.y, center.z]);
	//mat4.scale(mvMatrix,[100,100,100]);
	setMatrixUniforms();

	gl.uniform4fv(shaderProgram.uColorAttribute, [1.0, 1.0, 1.0, 0.6]);
	gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexPositionBuffer)
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mapVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);


	gl.bindBuffer(gl.ARRAY_BUFFER, mapNormalVectorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mapNormalVectorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mapVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mapVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mapTexture);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, mapVertexPositionBuffer.numItems);		
		
	mvPopMatrix();	
}

function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).

    gl.bindTexture(gl.TEXTURE_2D, null);

  }

var mapTexture;
function initTexture() {
	mapTexture = gl.createTexture();
	mapTexture.image = new Image();
	mapTexture.image.onload = function() {
	  handleLoadedTexture(mapTexture)
	}

	mapTexture.image.src = "map.png";
}


