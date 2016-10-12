
var config = {
  lastImportedKey: 'last-imported',
  notFirstVisitKey: 'not-first-visit',
  defaultFilePath: 'examples/octocat.gcode'
}


var scene = null,
    object = null,
    guiParameters,
    stats;

function about() {
  $('#aboutModal').modal();
}

var gr;

function onGCodeLoaded(gcode) {
      gr = new GCodeRenderer();
      var gcodeObj = gr.render(gcode);

      camera.position.z = 5500;
      // camera.position.y = -1000;
      // camera.position.x = 1000;
      camera.lookAt( gr.center );

  $('#aboutModal').modal('hide');
  if (object) {
    object.children.forEach(function(child) {
      if (child instanceof THREE.Line) {
        child.geometry.dispose();

        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        } else if (child.material instanceof THREE.MultiMaterial) {
          child.material.materials.forEach(function(mat) {
            mat.dispose();
          });
        }
      }
    });

    scene.remove(object);
  }

  object = gcodeObj;

  // reset gcodeindex slider to proper max
  var max = gr.visualToolPaths[0].layers.length-1;
  guiControllers.layerIndex.max(max);
  guiControllers.layerIndex.updateDisplay();
  guiControllers.layerIndex.setValue(max);

  scene.add(object);

}

$(function() {
  if (!Modernizr.webgl) {
    alert("Sorry, you need a WebGL capable browser to use this.\n\nGet the latest Chrome or FireFox.");
    return;
  }

  // Show 'About' dialog for first time visits.
  if (!localStorage.getItem(config.notFirstVisitKey)) {
    localStorage.setItem(config.notFirstVisitKey, true);
    setTimeout(about, 500);
  }

  $('.gcode_examples a').on('click', function(event) {
    GCodeImporter.importPath($(this).attr('href'), onGCodeLoaded);
    return false;
  })

  // Drop files from desktop onto main page to import them.
  $('body').on('dragover', function(event) {

    event.stopPropagation();
    event.preventDefault();
    event.originalEvent.dataTransfer.dropEffect = 'copy';

  }).on('drop', function(event) {

    event.stopPropagation();
    event.preventDefault();

    FileIO.load(event.originalEvent.dataTransfer.files, function(gcode) {
      GCodeImporter.importText(gcode, onGCodeLoaded);
    });

  });

  GCodeImporter.importPath('/examples/toothpaste_squeezer.gcode', onGCodeLoaded);

  scene = createScene($('#renderArea')[0]);

  setupGui();
});


var guiControllers = {
  layerIndex: undefined,
  individualLayer: undefined,
};

function setupGui() {

  var gui = new dat.GUI();

  $('.dg.main').mousedown(function(event) {
    event.stopPropagation();
  });

  guiParameters = {

    layerIndex: 0,
    updateLayer: false,
    individualLayer: false,
  };

  guiControllers.layerIndex = gui.add(guiParameters, "layerIndex").min(0).max(10000).step(1).listen();
  guiControllers.individualLayer = gui.add(guiParameters, 'individualLayer').name("show single layer").onChange(function(value) {
      guiParameters.updateLayer = true;
    });

  guiControllers.layerIndex.onChange(function(value) {
    guiParameters.updateLayer = true;
  });

};

