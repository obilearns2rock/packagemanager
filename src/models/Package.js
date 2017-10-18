export class Package {
  /**
   * 
   * @param {Number} price 
   * @param {Number} percentage 
   * @param {Number} duration 
   * @param {Date} creationDate 
   * @param {Array<Number>} runningDays 
   */
  constructor(id, price, activeDeposit, quantity, percentage, percentagePeriod, duration, creationDate, runningDays) {
    this._id = id;
    this._price = Number.parseFloat(price);
    this._activeDeposit = Number.parseFloat(activeDeposit);
    this._duration = Number.parseInt(duration);
    this._durationCounter = 0;
    this._percentage = Number.parseFloat(percentage);
    this._totalYield = 0;
    this._runCounter = 0;
    this._creationDate = new Date(creationDate);
    this._runningDays = runningDays;
    this._percentagePeriod = percentagePeriod;
    this._quantity = Number.parseInt(quantity);
  }

  get id() {
    return this._id;
  }

  get price() {
    return this._price;
  }

  get activeDeposit() {
    return this._activeDeposit;
  }

  get quantity() {
    return this._quantity;
  }

  get creationDate() {
    return this._creationDate;
  }

  get duration() {
    return this._duration;
  }

  get percentage() {
    return this._percentage;
  }

  get percentagePeriod() {
    return this._percentagePeriod;
  }

  get runningDays() {
    return this._runningDays;
  }

  get isActive() {
    return this._durationCounter < this._duration;
  }

  get durationCounter() {
    return this._durationCounter;
  }

  get runCounter() {
    return this._runCounter;
  }

  get totalYield() {
    return this._totalYield;
  }

  get currentDate() {
    let time = this._creationDate.getTime() + this._runCounter * 24 * 60 * 60 * 1000;
    return time;
  }

  set info(info) {
    this._info = info;
  }

  get info() {
    return this._info;
  }

  toString() {
    return `price: ${this._price.toFixed(4)}, percentage: ${this._percentage}, createdOn: ${this._creationDate}, yield: ${this._totalYield.toFixed(4)}, durationLeft: ${this._duration - this._durationCounter}, duration: ${this._duration}, runningDays: ${this._runCounter}`;
  }

  run() {
    let val = 0;
    if (this._durationCounter >= this._duration) {
      return val;
    }
    this._runCounter++;
    if (this._durationCounter < this._duration) {
      let time = this._creationDate.getTime() + this._runCounter * 24 * 60 * 60 * 1000;
      let day = new Date(time);
      switch (this.percentagePeriod) {
        case 'weekly':
          if (day.getDay() == 1) {
            val = this._activeDeposit * this._percentage / 100;
          }
          this._durationCounter++;
          break;
        case 'monthly':
          if (day.getDate() == 1) {
            val = this._activeDeposit * this._percentage / 100;
          }
          this._durationCounter++;
          break;
        case 'daily':
        default:
          if (this._runningDays.indexOf(day.getDay()) >= 0) {
            this._durationCounter++;
            val = this._activeDeposit * this._percentage / 100;
          }
          break;
      }
    }
    this._totalYield = this._totalYield + val * this.quantity;
    return val * this.quantity;
  }
}
