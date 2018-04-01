var octrotation = 0.0;
var cubeRotation = 0.0;
var numocts = 400;
// var numoctbw = 200;
var trans = 0.0;
var jump = 0;
var vely = 0.0;
var acc = 0.0;
var pos = 0.0;
var numobs = 30;
var dist = 45.0;
var pi = Math.PI
var speed = 15; 
var initrot = [];
var initrotsped = [];
var collflag = [];
var lives = 3;
var score = 0;
var grayScala = false;
var flashScala = false;
var level = 1;
for(var i=0;i<numobs;i++)
{
  initrot[i] = Math.random()*pi;
  initrotsped[i] = 0;
   -0.04 + Math.random()*0.08;
  collflag[i] = 0;
}


initrotsped[0] = 0.0;
initrotsped[1] = 0.0;
initrotsped[2] = 0.0;
initrotsped[3] = 0.0;

main();

//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const texture = loadTexture(gl, 'tex.jpg');
  const texture1 = loadTexture(gl, 'obs.jpg');


  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform bool flashScala;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;

      // Apply lighting effect

      highp vec3 directionalLightColor = vec3(0.6, 0.6, 0.6);
      if (flashScala == true)
        directionalLightColor = vec3(1.5, 1.5, 1.5);        
      
      highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
      highp vec3 directionalVector = normalize(vec3(0, -2.0, 10));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program

  const fsSource = `
    precision mediump float;
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    
    uniform sampler2D uSampler;
    uniform float now;
    uniform bool grayScala;
    
    vec4 toGrayscale(in vec4 color) {
      float average = (color.r + color.g + color.b) / 3.0;
      return vec4(average, average, average, 1.0);
      
    }
    
    
    void main(void) {
      
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
      
      if (grayScala == true)
        gl_FragColor = toGrayscale(vec4(texelColor.rgb * vLighting, texelColor.a));   

      else
        gl_FragColor = vec4(texelColor.rgb *vLighting, texelColor.a);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
   const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      grayScala: gl.getUniformLocation(shaderProgram, 'grayScala'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
      flashScala: gl.getUniformLocation(shaderProgram, 'flashScala'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);
  var buffersobs = [];

  for(var i=0;i<numobs;i++)
    buffersobs[i] = initBuffersobs(gl);


  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers,buffersobs, texture, texture1,deltaTime);

    for(var i=0;i<numobs;i++)
    {
      var tempu = (10000*pi + initrot[i] + octrotation)%pi;
      if(trans <= dist*i + 0.2 && trans >= dist*i - 0.2 && (tempu%pi <= 0.65 || tempu%pi >= 2.5 || jump == 1)&& collflag[i] == 0 )
      {
        // console.log(initrot[i] + octrotation);
        collflag[i] = 1;
        // alert('Life--');
        lives--;
        if(lives == 0)
          break;
      }

      initrot[i]+=initrotsped[i];
    }
      
    gl.uniform1i(programInfo.uniformLocations.flashScala, flashScala);
    gl.uniform1i(programInfo.uniformLocations.grayScala, grayScala);
    if (now%5 > 4.2)
        flashScala = true;
    else 
        flashScala = false;

    score+=0.1

    if(Math.floor(score) > 50)
    {
      level = 2;
      speed = 20;
    }

    if(Math.floor(score) > 150)
    {
      level = 3;
      speed = 25;
    }

    if(Math.floor(score) > 250)
    {
      level = 4;
      speed = 30;
    }

    document.getElementById('Score').innerHTML = Math.floor(score);
    document.getElementById('Lives').innerHTML = lives;
    document.getElementById('Level').innerHTML = level;
    document.getElementById('Speed').innerHTML = speed*10;
    if(lives == 0)
    {
      alert('Game Over!\nScore: ' + Math.floor(score));
      lives = 3;
      score = 0;
      trans = 0.0;
      speed = 15;
      for(var i=0;i<numobs;i++)
      {
        initrot[i] = Math.random()*pi;
        initrotsped[i] = -0.04 + Math.random()*0.08;
        collflag[i] = 0;
      }
      initrotsped[0] = 0.0;
      initrotsped[1] = 0.0;
      initrotsped[2] = 0.0;
    }
    // score = Math.floor(score + 0.1);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//


Mousetrap.bind('p+o', function () {
  octrotation-=0.1;
  if(jump == 0)
  {
    jump = 1;
    vely = -0.1;
    acc = 0.005
  }
})

Mousetrap.bind('right+space', function () {
  octrotation-=0.1;
  if(jump == 0)
  {
    jump = 1;
    vely = -0.1;
    acc = 0.005
  }
})

Mousetrap.bind('left+space', function () {
  octrotation+=0.1;
  if(jump == 0)
  {
    jump = 1;
    vely = -0.1;
    acc = 0.005
  }
})

Mousetrap.bind('right', function () {
   octrotation-=0.1;
})

Mousetrap.bind('left', function () {
   octrotation+=0.1;
})

Mousetrap.bind('space', function () {
  if(jump == 0)
  {
    jump = 1;
    vely = -0.1;
    acc = 0.005
  }
})

Mousetrap.bind('b', function () {
  //console.log("mouse");
  grayScala = !grayScala
  //cubeRotation -= zrotate;
})

Mousetrap.bind('p', function () {
    togglePause();
})


function initBuffersobs(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  const positions = [
    // Front face
    -0.1, -0.1,  0.1,
     0.1, -0.1,  0.1,
     0.1,  0.1,  0.1,
    -0.1,  0.1,  0.1,

    // Back face
    -0.1, -0.1, -0.1,
    -0.1,  0.1, -0.1,
     0.1,  0.1, -0.1,
     0.1, -0.1, -0.1,

    // Top face
    -0.1,  0.1, -0.1,
    -0.1,  0.1,  0.1,
     0.1,  0.1,  0.1,
     0.1,  0.1, -0.1,

    // Bottom face
    -0.1, -0.1, -0.1,
     0.1, -0.1, -0.1,
     0.1, -0.1,  0.1,
    -0.1, -0.1,  0.1,

    // Right face
     0.1, -0.1, -0.1,
     0.1,  0.1, -0.1,
     0.1,  0.1,  0.1,
     0.1, -0.1,  0.1,

    // Left face
    -0.1, -0.1, -0.1,
    -0.1, -0.1,  0.1,
    -0.1,  0.1,  0.1,
    -0.1,  0.1, -0.1,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

  // Convert the array of colors into a table for all the vertices.

  var textureCoordinates = [];

  for (var j = 0; j < 6; ++j) {
    const c = [ 0.0,0.0,1.0,0.0,1.0,1.0,0.0,1.0];

    // Repeat each color four times for the four vertices of the face
    textureCoordinates = textureCoordinates.concat(c, c, c, c);
  }

   const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
                gl.STATIC_DRAW);
  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

function initBuffers(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  var h = 1; 
  var s = (Math.sqrt(2) - 1) * h;

  temp = [
    // Front face  // (0,4,0)
     s, h,  1.0,
    -s, h,  1.0,
     s, h, -1.0,
    -s, h, -1.0,

    // Back face // (-1.2, -1.2, 0) 
     s, h,  1.0,
     h, s,  1.0,
     s, h, -1.0,
     h, s, -1.0,

    // Top face  (4, 0, 0) 
     h, s,  1.0,
     h,-s,  1.0,
     h, s, -1.0,
     h,-s, -1.0,

     h,-s,  1.0,  // (-1.2, 1.2, 0)
     s,-h,  1.0,
     h,-s, -1.0,
     s,-h, -1.0,

     s,-h,  1.0, //  (0, -4, 0) 
    -s,-h,  1.0,
     s,-h, -1.0,
    -s,-h, -1.0,

    -s,-h,  1.0, //  (1.2, 1.2, 0) 
    -h,-s,  1.0,
    -s,-h, -1.0,
    -h,-s, -1.0,

    -h,-s,  1.0, //  (-4, 0, 0) 
    -h, s,  1.0,
    -h,-s, -1.0,
    -h, s, -1.0,

    -h, s,  1.0, // (1.2, -1.2, 0)s
    -s, h,  1.0,
    -h, s, -1.0,
    -s, h, -1.0,
  ];


  var positions = temp;
  for(var i=0;i<numocts-1;i++)
  {
    for(var j = 2;j<96 ;j+=3)
    {
      temp[j] = temp[j] - 2;
    }
    positions  = positions.concat(temp);
  }

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.


  const faceColorsbw = [
    [1.0,  1.0,  1.0,  1.0],    // Front face: white
    [0.0,  0.0,  0.0,  1.0],    // Front face: white
  ];
  // Convert the array of colors into a table for all the vertices.

   const faceColors = [
    [1.0, 102/255,  1.0,  1.0],    // Front face: white
    [1.0,  1.0,  102/255,  1.0],    // Top face: green
    [51/255,  153/255,  1.0,  1.0],    // Bottom face: blue
    [1.0,  1.0,  102/255,  1.0],    // Right face: yellow
    [0.0,  102/255,  204/255,  1.0],    // Left face: purple
    [0.0,  1.0,  1.0,  1.0],    // Left face: purple
    [1.0,  0.0,  1.0,  1.0],    // Left face: purple
    [1.0,  51/255,  1.0,  1.0],    // Left face: purple
    [1.0,  153/255,  51/255,  1.0],    // Left face: purple
    [51/255,  1.0,  51/255,  1.0],    // Left face: purple
    [1.0,102/255,102/255,1.0]

  ];
  var colors = [];

  for (var j = 0; j < 8*numocts; ++j) {
    // const c = faceColors[Math.floor(Math.random() * faceColors.length)];;
    var start = 80;
    var end = 100;
    var start2 = 140
    var end2 = 170;
    var start3 = 0;
    var end3 = 30;
    var start4 = 275;
    var end4 = 325;
    var c;
    if(j >= 8*start && j <= 8*end)
    {
      // c = faceColorsbw[Math.floor(Math.random() * 2)];
      if(j%2 == 0)
        c = [1.0,  1.0,  1.0,  1.0];
      else
        c = [0.0,  0.0,  0.0,  1.0];
    }
    else if ((j >= 8*start2 && j <= 8*end2) || (j >= 8*start3 && j <= 8*end3) || ((j >= 8*start4 && j <= 8*end4)))
    {

      if((Math.floor(j/8))%2 == 0)
      {
        if(j%2 == 0)
          c = [1.0,  1.0,  1.0,  1.0];
        else
          c = [0.0,  0.0,  0.0,  1.0];
      }
      else
      {
        if(j%2 == 1)
          c = [1.0,  1.0,  1.0,  1.0];
        else
          c = [0.0,  0.0,  0.0,  1.0];
      }
    }
    else
      // c = faceColors[Math.floor(Math.random() * 11)];
      c = [Math.floor(Math.random() * 256)/255.0,Math.floor(Math.random() * 256)/255.0,Math.floor(Math.random() * 256)/255.0,1.0];
    // Repeat each color four times for the four vertices of the face
    colors = colors.concat(c, c, c, c);
  }

  var textureCoordinates = [];
  var c = [0.0,0.0,0.0,0.0,1.0,1.0,0.0,1.0];
  for (var j = 0; j < 8*numocts; ++j)
  {
    textureCoordinates = textureCoordinates.concat(c,c,c,c);
  }

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),gl.STATIC_DRAW);
  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  var vertexNormals = [];
  var c = [
      [5.65, 2.34, 0],
      [2.34, 5.65, 0],
      [-2.34, 5.65, 0],
      [-5.65, 2.34, 0],
      [-5.65, -2.34, 0],
      [-2.34, -5.65, 0],
      [2.34, -5.65, 0],
      [5.65, -2.34, 0]
  ];
  for (var j = 0; j < numocts; ++j)
  {
    for(var k= 0;k < 8;k++)
    {
      vertexNormals = vertexNormals.concat(c[k],c[k],c[k],c[k]);
    }
  }

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals),
                gl.STATIC_DRAW);


  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

   var indices_temp = [
    0,  1,  2,      1,  2,  3,    
    4,  5,  6,      5,  6,  7,    
    8,  9,  10,     9,  10, 11,   
    12, 13, 14,     13, 14, 15,   
    16, 17, 18,     17, 18, 19,   
    20, 21, 22,     21, 22, 23,   
    24, 25, 26,     25, 26, 27,   
    28, 29, 30,     29, 30, 31,   
  ];
  var indices = indices_temp;
  for(var i=0;i<numocts - 1;i++)
  {
    for(var j=0;j<48;j++)
      indices_temp[j] = indices_temp[j] + 32;

    indices = indices.concat(indices_temp);
 
  }
  // console.log(indices);
  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    normal: normalBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

//
// Draw the scene.
//


function drawScene(gl, programInfo, buffers,buffersobs,texture, texture1,deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [-0.0, 0.75 + pos, trans]);  // amount to translate
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              octrotation,     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)
  // console.log(octrotation + "Tunn")
  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32 bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}

 {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.normalMatrix,
      false,
      normalMatrix);
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  {
    const vertexCount = 48*numocts;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

//   octrotation += deltaTime;


  for(var i=0;i<numobs;i++)
      drawSceneobs(gl, programInfo, buffersobs[i], i,texture1,deltaTime);

console.log(octrotation);

trans+=deltaTime*speed;
// speed+=.005;
if(trans >= 600)
{
  for(var i=0;i<numobs;i++)
  {
    initrot[i] = Math.random()*pi;
    initrotsped[i] = -0.04 + Math.random()*0.08;
    collflag[i] = 0;
  }
  trans = 0;
}

if(jump == 1)
{
  vely+=acc;
}
pos+=vely;

if(pos >= 0)
{
  jump = 0;
  vely = 0.0;
  acc = 0.0;
  pos = 0.0;
}

}


function drawSceneobs(gl, programInfo, buffers,ind, texture,deltaTime) {
  // gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  // gl.clearDepth(1.0);                 // Clear everything
  // gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  // gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // // Clear the canvas before we start drawing on it.

  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  mat4.translate(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [0.0,  0.75+pos , -dist*ind + trans]);  // amount to translate
  mat4.rotate(modelViewMatrix,  // destination matrix
              modelViewMatrix,  // matrix to rotate
              initrot[ind] + octrotation,     // amount to rotate in radians
              [0, 0, 1]);       // axis to rotate around (Z)
  mat4.scale(modelViewMatrix,     // destination matrix
                 modelViewMatrix,     // matrix to translate
                 [2.0, 10.0, 1.0]);  // amount to translate



  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
 const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32 bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, num, type, normalize, stride, offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  }

 

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

}
//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  const image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       // Yes, it's a power of 2. Generate mips.
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       // No, it's not a power of 2. Turn of mips and set
       // wrapping to clamp to edge
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}