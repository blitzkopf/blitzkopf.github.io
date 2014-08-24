var gl;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
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

/*      shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
*/
	shaderProgram.uColorAttribute = gl.getUniformLocation(shaderProgram, "uVertexColor");
    //gl.enableVertexAttribArray(shaderProgram.uColorAttribute);

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
var circVertexPositionBuffer;

var icoVertexColorBuffer;
var icoVertexIndexBuffer;
var vertices;
var circVert = [];
var midPointCache = {};

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

function initBuffers() {


	// http://blog.andreaskahler.com/2009/06/creating-icosphere-mesh-in-code.html
	//t = 1.6180339887; // (1.0 + Math.Sqrt(5.0)) / 2.0;
	s = 0.447213595; // 1 / sqrt(5)
	t = 0.894427191; // 2 / sqrt(5)

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
	
	for ( k = 0 ; k < 2 ; k++) {
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

    icoVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, icoVertexIndexBuffer);

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(icoVertexIndices), gl.STATIC_DRAW);
    icoVertexIndexBuffer.itemSize = 1;
    icoVertexIndexBuffer.numItems = icoVertexIndices.length;
}

function initCircle(parts) {
	for(i=0 ; i<parts ; i++) {
		circVert[3*i + 0] = Math.sin(2.0*i*Math.PI/parts);
		circVert[3*i + 1] = Math.cos(2.0*i*Math.PI/parts);
		circVert[3*i + 2] = 0;
	}
	circVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,circVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circVert),gl.STATIC_DRAW);
	circVertexPositionBuffer.itemSize = 3;
	circVertexPositionBuffer.numItems = parts;
}
function setLighting() {
	gl.uniform1i(shaderProgram.useLightingUniform, 1);

	gl.uniform3f(
		shaderProgram.ambientColorUniform,
		0.2, 0.2, 0.2 
	);
	var lightingDirection = [ 0.0 , 0.0, -1.0 ];
	var adjustedLD = vec3.create();
	vec3.normalize(lightingDirection, adjustedLD);
	vec3.scale(adjustedLD, -1);
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

	gl.uniform4fv(shaderProgram.uColorAttribute, color);


	/*gl.bindBuffer(gl.ARRAY_BUFFER, icoVertexColorBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, icoVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	*/
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
	// draw longtitutes
	for( lon  = 0; lon < 180 ; lon ++) {
		mvPushMatrix();

		mat4.rotate(mvMatrix,lon*Math.PI/180,[1,0,0]);

		gl.uniform4fv(shaderProgram.uColorAttribute, [1.0, lon%2, 1.0, 1.0]);
		setMatrixUniforms();
		gl.bindBuffer(gl.ARRAY_BUFFER, circVertexPositionBuffer)
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, circVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.LINE_LOOP, 0, circVertexPositionBuffer.numItems);

		mvPopMatrix();
	
	} 
	mvPopMatrix();

	for( lat = 0; lat < 90; lat ++) {
		mvPushMatrix();
		var sz = radius*Math.cos(lat*Math.PI/180);

		mat4.translate(mvMatrix, [pos.x, pos.y, pos.z+radius*Math.sin(lat*Math.PI/180)]);
		mat4.scale(mvMatrix,[sz,sz,sz]);

		gl.uniform4fv(shaderProgram.uColorAttribute, [1.0, 1.0, lat%2, 1.0]);
		setMatrixUniforms();
		gl.bindBuffer(gl.ARRAY_BUFFER, circVertexPositionBuffer)
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, circVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.LINE_LOOP, 0, circVertexPositionBuffer.numItems);		
		mvPopMatrix();
	}
	
}


