class FishingStats {
  constructor(data) {
    this.userId = data.userId;
    this.username = data.username;
    this.totalCatch = data.totalCatch || 0;
  }
}

class VisitStats {
  constructor(data) {
    this.userId = data.userId;
    this.username = data.username;
    this.totalHours = data.totalHours || 0;
  }
}

module.exports = { FishingStats, VisitStats };