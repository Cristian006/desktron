function phone(obj){
    this.model = '';
    this.dispatch = '';
    this.serial = 0;
    this.place = '';
    this.address = '';
    this.color = '';
    this.note = '';
    this.screen = {
        pn : '',
        sn : '',
        rn : ''
    };
    this.screws = '';
    this.started = null;
    this.ended = null;
    this.total = null;

    if(obj != null){
        console.log("OBJECT IS NOT NULL " + obj);
        for (var prop in obj){
            console.log(prop + "    " + obj[prop]);
            this[prop] = obj[prop];
        }
    }
    else{
        console.log("OBJECT IS NULL");
    }
}

module.exports = phone;