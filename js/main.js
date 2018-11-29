( (SolarLib, THREE, dat, exports, FlyControls) => {
  "use strict";

// textures courtesy of James Hastings-Trew via website links below
// http://planetpixelemporium.com/index.php
// http://planetpixelemporium.com/planets.html
// Purely for educational, non-commercial use in this instance
window.addEventListener("load", init, false);

// Boolean for start and restart
    var initAnim = true;
    var runAnim = false;
    var isPlay = false;
    var theta = 0;

var scene, camera, renderer, controls; // global vars needed throughout the program

var width = window.innerWidth;
var height = window.innerHeight;
var aspectRatio = width / height;
var solarBodies = new Map();
var planets = new Map();
var orbits = new Map();


    var saturnRotate = 2.35;
    var innerMoon = 0.4;
    var outerMoon = 1;

var clock;
var sunControls, glowControls;

function init() {
  clock = new THREE.Clock();

  // TEXTURES
  var textureLoader       = new THREE.TextureLoader();
  var textureSun2         = textureLoader.load( "assets/saturnTexture.jpg" );
  var textureEarth        = textureLoader.load( "assets/moon.jpg" );
  var textureVenus        = textureLoader.load( "assets/moon.jpg" );
  var textureSaturn       = textureLoader.load( "assets/saturnmap.jpg" );

  var textureSaturnRings  = textureLoader.load( "assets/saturnRing.png" );

  // SCENE
  scene = new THREE.Scene();
  scene.background = new THREE.Color().setHSL( 0.51, 0.4, 0.02 );

  // RENDERER
  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize( width, height );
  document.body.appendChild( renderer.domElement );

  // CAMERA
  camera = new THREE.PerspectiveCamera(45, aspectRatio, 5, 500000);
  camera.position.y = 735;
  camera.position.z = 2935;

  // LIGHTS
  var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x999999, 0.2);
  scene.add(hemisphereLight);

  var pointLight = new THREE.PointLight(0xffffff, 1.0, 0, 1);
  pointLight.position.set(0, 0, 0);
//  pointLight.castShadow = true;

  scene.add(pointLight);

  window.addEventListener( 'resize', onWindowResize, false );


  // create our solar objects as the textures get loaded
  // size the system in relation to earth and the sun
  var sunSize   = 300;
  var earthSize = 20; // 2.29
  var earthOrbit = 4 * sunSize;
  var earthSpeed = 1;
  var earthRotateSpeed = 1;


  var glowMaterial = new THREE.ShaderMaterial({
    vertexShader:   exports.shaderGlow.vertex,
    fragmentShader: exports.shaderGlow.fragment,
    side: THREE.BackSide,
		blending: THREE.AdditiveBlending,
		transparent: true
  });

  var shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: exports.shader.vertex,
    fragmentShader: exports.shader.fragment
  });

  var sun = new SolarLib.PlanetWithRings({
      name: "Saturn", texture: textureSaturn,
        ringsTexture: textureSaturnRings, ringAngle: 90,
        ringDistance: earthSize * 2.0, ringSize: earthSize * 6.00,
         rotateSpeed: earthRotateSpeed * 2.35,
        color: 0x000000,
    x: 0, y: 0, z: 0,
    sunSize,
    glowUniforms: {
      bumpTexture: textureSun2
    },
    sunUniforms: {
      texture: textureSun2,
      sphereTexture: textureSun2,
    }
  });
  sun.sunMaterial = shaderMaterial;
  sun.glowMaterial = glowMaterial;
  var sunObj = sun.create();
  scene.add( sunObj.sun );
  // scene.add( sunObj.glow );

  solarBodies.set(sun.name, sun);

// } // end for

  // create orbit sizes
  orbits.set("Venus", new SolarLib.Orbit({ name: "Venus", orbitSize: earthOrbit * .72 }) );
  orbits.set("Earth", new SolarLib.Orbit({ name: "Earth", orbitSize: earthOrbit }) );
 orbits.set("Saturn", new SolarLib.Orbit({ name: "Saturn", orbitSize: earthOrbit * .0 }) );
  orbits.forEach( (orbit, key, map) => {
    var curObject = orbit.draw();
    scene.add(curObject);
  });

  planets.set("Venus", new SolarLib.Planet({
    name: "Venus", texture: textureVenus,
    orbit: orbits.get("Venus").orbitSize, speed: earthSpeed * .4,
    radius: earthSize * 6.0,
    color: 0x000000, rotateSpeed: earthRotateSpeed * 0.2,
    x: 0, y:0, z:0
  }));

  planets.set("Earth", new SolarLib.Planet({
    name: "Earth", texture: textureEarth,
    orbit: orbits.get("Earth").orbitSize, speed: earthSpeed,
    radius: earthSize * 6.5, rotateSpeed: earthRotateSpeed * 0.2,
    color: 0x000000,
    x: 0, y:0, z:0
  }));

  planets.set("Saturn", new SolarLib.PlanetWithRings({
    name: "Saturn", texture: textureSaturn,
    ringsTexture: textureSaturnRings, ringAngle: 45,
    ringDistance: earthSize * 3.0, ringSize: earthSize * 8.0,
    orbit: orbits.get("Saturn").orbitSize, speed: earthSpeed * 70.0,
    radius: earthSize * 15, rotateSpeed: earthRotateSpeed * 2.35,
    color: 0x000000,
    x: 0, y:0, z:0
  }) );

  // Create Planets
  planets.forEach( (planet, key, map) => {
    var curObject = planet.create(scene);
    scene.add(curObject);
  });

  // Create Stars
  var StarsObj = new SolarLib.Stars({ spreadMultiplier: 2000 });
  var stars = StarsObj.create();
  for(let starInst of stars) {
    scene.add(starInst);
  }

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  animate();
// START FUNCTION DEFINITIONS ------------------------------------------------------

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    solarBodies.forEach( (solarBody, key, map) => {
      solarBody.onResize(window.innerWidth, window.innerHeight);
    });

    renderer.setSize( window.innerWidth, window.innerHeight );

  } // onWindowResize

    window.addEventListener("keydown", speeds, false);
    function speeds(key) {

        if (key.keyCode == "73"){
            earthSpeed ++;
            // alert("This is a key " + earthSpeed);
        }
        else if (key.keyCode == "85") {
            earthSpeed --;
        }
    }


    function animate() {
        requestAnimationFrame( animate );
        // controls.update();


        var time = Date.now() * .01;

        var count = 0;
        solarBodies.forEach( (solarBody, key, map) => {

            solarBody.update(time, clock, camera, sunControls, glowControls);

        });
        planets.forEach( (planet, key, map) => {
            planet.update(time);
            // planet.update(earthSpeed);
        });

        controls.update( 1 );
        renderer.render( scene, camera );

    } // end animate()

} // end init

} )(window.SolarLib, THREE, dat, window.exports);
