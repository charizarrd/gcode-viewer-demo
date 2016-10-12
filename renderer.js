var camera, controls, renderer, composer;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var selected = false;

function createScene(container) {

  var containerWidth  = window.innerWidth || 2, //container.offsetWidth,
      containerHeight = window.innerHeight || 2; //container.offsetHeight;

  // var containerWidth = container.offsetWidth;
  // var containerHeight = container.offsetHeight;

  var autoRotate = false;


  init();
  animate();

  function init() {

    var i;


    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer( { clearColor: 0x000000, clearAlpha: 1, antialias: false } );
    renderer.autoClear = false;

    container.appendChild( renderer.domElement );

    // Lights...
    [[ 0, 0, 1, 0xFFFFCC],
     [ 0, 1, 0, 0xFFCCFF],
     [ 1, 0, 0, 0xCCFFFF],
     [ 0, 0,-1, 0xCCCCFF],
     [ 0,-1, 0, 0xCCFFCC],
     [-1, 0, 0, 0xFFCCCC]].forEach(function(position) {
      var light = new THREE.DirectionalLight(position[3]);
      light.position.set(position[0], position[1], position[2]).normalize();
      scene.add(light);
    });

    // Camera...
    var fov    = 45,
        aspect = containerWidth / containerHeight,
        near   = 1,
        far    = 10000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    // camera = new THREE.OrthographicCamera( containerWidth / - 2, containerWidth / 2, containerHeight / 2, containerHeight / - 2, near, far);
    // camera.position.set(0,0,50);

    scene.add(camera);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.15;

    setSize(containerWidth, containerHeight);

    // Fix coordinates up if window is resized.
    window.addEventListener( 'resize', function() {
      setSize(window.innerWidth, window.innerHeight)
    }, false );

    // container.addEventListener('click', onMouseDown, false);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '40px';
    container.appendChild( stats.domElement );
  }

  function animate() {
    requestAnimationFrame( animate);
    stats.begin();
    render();
    stats.end();

  }

  function render() {

    var time = Date.now() * 0.0005;

    for ( var i = 0; i < scene.children.length; i ++ ) {

      var object = scene.children[ i ];

      if(autoRotate) {
        if ( object instanceof THREE.Object3D ) {
          object.rotation.y = object.rotation.y + 0.015;
        }
      }
    }

    if( guiParameters && gr ) {
      if (guiParameters.updateLayer) {
        if (guiParameters.individualLayer) {
          gr.setVisibleLayerRange(guiParameters.layerIndex-1, guiParameters.layerIndex);   
        } else {
          gr.setVisibleLayerRange(0, guiParameters.layerIndex);  
        }
        guiParameters.updateLayer = false;

        guiParameters.gcodeIndex = 0;
      }


    }

    controls.update();

    renderer.clear();
    renderer.render(scene, camera);

  }

  function setSize(width, height) {

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

  }

  function onMouseDown( event ) {
    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var foundIntersection = false;

    // See if the ray from the camera into the world hits mesh
    if (gr) {
      gr.visualToolPaths.forEach(function(visualPath) {
        var mesh = visualPath.getVisibleExtrusionMesh();
        var intersects = raycaster.intersectObject( mesh );

        if ( intersects.length > 0 ) {
          for (var k = 0; k < intersects.length; k++) {
          var visualPathFacesIndex = visualPath.extrusionTubeFacesIndex;
          var start = visualPathFacesIndex[0];
          var target = intersects[k].faceIndex*3;
          for (var i = 1; i < visualPathFacesIndex.length; i++) {
            var end = visualPathFacesIndex[k];

            if ((target >= start) && (target < end)) {
              // check if currently visible
              var visibleTubeRanges = visualPath.visibleTubeRanges;
              if (start >= visibleTubeRanges[0] && end <= visibleTubeRanges[visibleTubeRanges.length-1]) {
                var geo = mesh.geometry;

                // remove any previously highlighted extrusions
                var index = null;
                for (var j = geo.groups.length-1; j >= 0; j--) {
                  if (geo.groups[j].materialIndex === 1) {
                    index = j;
                    break;
                  }
                }

                if (index !== null)
                  geo.groups.splice(index, 1);

                geo.addGroup(start, end - start, 1);

                // relevant gcode command
                // console.log(visualPath.commands[i*3]);


                changeCameraTarget(intersects[k].point);

                selected = true;
                foundIntersection = true;
                break;
              }
            }
            start = end;
          }
          }
        }
      });

      // if (!foundIntersection) {
      //   gr.visualToolPaths.forEach(function(visualPath) {
      //     var mesh = visualPath.getVisibleExtrusionMesh();
      //     var geo = mesh.geometry;

      //     var index = null;
      //     for (var j = geo.groups.length-1; j >= 0; j--) {
      //       if (geo.groups[j].materialIndex === 1) {
      //         index = j;
      //         break;
      //       }
      //     }

      //     if (index !== null)
      //       geo.groups.splice(index, 1);

      //   });
      // }
    }

  }

  function changeCameraTarget( newTarget ) {
    controls.target.set(newTarget.x, newTarget.y, newTarget.z);
    camera.lookAt(newTarget);
  }


  return scene;
}
