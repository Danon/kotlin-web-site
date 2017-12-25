var icon = require('./marker-icon.png');
var inactiveIcon = require('./marker-icon-inactive.png');
var highlightedIcon = require('./marker-icon-highlighted.png');
var EVENTS = require('./../events-list');
var emitter = require('../../../util/emitter');

export default class Marker {
  /**
   * @param {Event} event
   * @param {Object} map Google Map instance
   * @param {Object} offset Latitude and Longitude to add to `event.city.position`
   */
  constructor(event, map, offset) {
    const marker = event.marker = this;
    this.event = event;
    this.map = map;
    this.isActive = true;
    this.isHighlighted = false;
    this.offset = offset;

    const markerInstance = new google.maps.Marker({
      title: event.title,
      position: this.calculatePosition(),
      draggable: false,
      visible: true,
      icon: this.getIcon(),
      map: map ? map.instance : null
    });

    this.marker = markerInstance;

    markerInstance.addListener('click', () => {
      emitter.emit(EVENTS.EVENT_SELECTED, event);
    });

    markerInstance.addListener('mouseover', () => {
      marker.highlight();
      emitter.emit(EVENTS.EVENT_HIGHLIGHTED, event);
    });

    markerInstance.addListener('mouseout', () => {
      marker.unhighlight();
      emitter.emit(EVENTS.EVENT_UNHIGHLIGHTED, event);
    });

    // Info window
    const infoWindow = new google.maps.InfoWindow({
      content: event.title
    });

    infoWindow.addListener('closeclick', () => {
      emitter.emit(EVENTS.EVENT_DESELECTED);
    });

    this.infoWindow = infoWindow;
  }

  calculatePosition() {
      let cityPosition = this.event.city.position;
      return {lat: cityPosition.lat + this.offset.lat, lng: cityPosition.lng + this.offset.lng};
  }

  getIcon() {
    const {isActive, isHighlighted} = this;
    const mapZoom = this.map.instance.getZoom();
    const hasTags = this.event.tags.length > 0;
    let iconUrl = isActive ? (hasTags ? taggedIcon : icon) : inactiveIcon;

    if (isHighlighted) {
      iconUrl = hasTags ? taggedHighlightedIcon : highlightedIcon;
    }

    return {
      scaledSize: {
        width: 15,
        height: 15
      },
      opacity: 1,
      url: iconUrl
    };
  }

  openWindow() {
    this.infoWindow.open(this.map.instance, this.marker);
  }

  closeWindow() {
    this.infoWindow.close();
  }

  highlight() {
    const {marker} = this;
    this.isHighlighted = true;
    marker.setIcon(this.getIcon());
    marker.setZIndex(30);
  }

  unhighlight() {
    const {marker} = this;
    this.isHighlighted = false;
    marker.setIcon(this.getIcon());
    marker.setZIndex(this.isActive ? 2 : 1);
  }

  activate() {
    const {marker} = this;
    this.isActive = true;
    this.isHighlighted = false;
    marker.setIcon(this.getIcon());
    marker.setZIndex(2);
  }

  deactivate() {
    const {marker} = this;
    this.isActive = false;
    this.isHighlighted = false;
    marker.setIcon(this.getIcon());
    marker.setZIndex(1);
  }

  show() {
    this.marker.setVisible(true);
  }

  hide() {
    this.marker.setVisible(false);
  }
}