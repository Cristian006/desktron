function user(name){
    this.name = name;
    this.clockin = null;
    this.clockout = null;
    this.phones = [];
}
module.exports = user;