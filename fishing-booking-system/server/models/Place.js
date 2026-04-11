class Place {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.coordinates = data.coordinates;
    this.description = data.description || '';
    this.maxCapacity = data.maxCapacity || 2;
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}

module.exports = Place;