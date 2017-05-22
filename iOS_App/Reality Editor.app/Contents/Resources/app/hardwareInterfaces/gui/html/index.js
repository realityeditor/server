(function(exports) {

  // BLE Bluetooth button for WeDo section

  // Conect button for Philips HUE section

  var buttonConnect = document.getElementById('buttonConnect');
/*
  buttonConnect.addEventListener('click', function(e) {

    if (buttonConnect.innerHTML === 'CONNECT') {
      connectHue();
    } else {
      disconnectHue();
    }

  });
*/
  function connectHue() {
    buttonConnect.innerHTML = 'DISCONNECT';
    var hueButtonDivs = getHueButtonDivs();
    hueButtonDivs.forEach(function(elt) {
      if (elt.classList.contains('inactive')) {
        elt.classList.remove('inactive');
        elt.classList.add('active');
      }
    });
  }

  function disconnectHue() {
    buttonConnect.innerHTML = 'CONNECT';
    var hueButtonDivs = getHueButtonDivs();
    hueButtonDivs.forEach(function(elt) {
      if (elt.classList.contains('active')) {
        elt.classList.remove('active');
        elt.classList.add('inactive');
      }
    });
  }

  function getHueButtonDivs() {
    return  [].slice.call(document.getElementById('hueButtons').children).filter(function(elt){
      return elt.tagName === "DIV";
    });
  }

}(window));
