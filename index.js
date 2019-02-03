'use strict';
var inherits = require('util').inherits;
var Service, Characteristic;
var inherits = require('util').inherits;

const sqlite3 = require('sqlite3').verbose();

const path = require('path');


var exec2 = require("child_process").exec;
var dateTime = require('node-datetime');
var dt = dateTime.create();
var formatted = dt.format('Y/m/d');
var data2, data3, totalDay, totalMonth, totalAll, plusOne, plusOneDay;
var contenitore = new Array();
var contDay = new Array();
data2= formatted.toString();
data2 = data2.replace('/', '');
data2 = data2.replace('/', '');
data3 = data2.substr(0,8);
data2 = data2.substr(0,6);
parseInt(totalMonth);
totalMonth=0;
totalDay=0;
plusOne=0;
plusOneDay=0;
module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory('homebridge-samsung-power', 'SamsungPowerConsumption', PowerConsumptionAccessory);
};

function PowerConsumptionAccessory(log, config) {
    this.log = log;
    this.name = config['name'];
    this.ip = config['ip'];
    this.token = config['token'];
    this.patchCert=config['patchCert'];
    this.patchDatabase = config['patchDatabase'];
    this.dataBName = config['dataBName'];
    const dbPath = path.resolve(__dirname, this.patchDatabase+this.dataBName+'Out.db');
    this.powerConsumption = 0;
    this.totalPowerConsumption = 0;
    var EvePowerConsumption = function() {
        Characteristic.call(this, 'Consumption', 'E863F10D-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
                      format: Characteristic.Formats.UINT16,
                      unit: 'watts',
                      maxValue: 1000000000,
                      minValue: 0,
                      minStep: 1,
                      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
                      });
        this.value = this.getDefaultValue();
    };
    inherits(EvePowerConsumption, Characteristic);
    
    var EveTotalPowerConsumption = function() {
        Characteristic.call(this, 'Total Consumption', 'E863F10C-079E-48FF-8F27-9C2605A29F52');
        this.setProps({
                      format: Characteristic.Formats.FLOAT, // Deviation from Eve Energy observed type
                      unit: 'kilowatthours',
                      maxValue: 1000000000,
                      minValue: 0,
                      minStep: 0.001,
                      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
                      });
        this.value = this.getDefaultValue();
    };
    inherits(EveTotalPowerConsumption, Characteristic);
    
    var PowerMeterService = function(displayName, subtype) {
        Service.call(this, displayName, '00000001-0000-1777-8000-775D67EC4377', subtype);
        this.addCharacteristic(EvePowerConsumption);
        this.addOptionalCharacteristic(EveTotalPowerConsumption);
    };
    
    inherits(PowerMeterService, Service);
    
    this.service = new PowerMeterService('Energia');
    this.service.getCharacteristic(EvePowerConsumption).on('get', this.getPowerConsumption.bind(this));
    this.service.addCharacteristic(EveTotalPowerConsumption).on('get', this.getTotalPowerConsumption.bind(this));
}

PowerConsumptionAccessory.prototype.getPowerConsumption = function (callback) {
    var self = this;
const dbPath = path.resolve(__dirname, this.patchDatabase+this.dataBName+'Out.db');
    var body2;
    var totalEnergy;
    var str; //Nuovo
    str = 'curl -O -k -H "Content-Type: application/json" -H "Authorization: Bearer '+this.token+'" --cert '+this.patchCert+' --insecure -X GET https://'+this.ip+':8888/files/'+this.dataBName+'.db';
    console.log(str);
    exec2(str, body2, function(error, stdout, stderr) {
          if(error) {
          //this.log('Power function failed', stderr);
          callback(error);
          } else {
          console.log('Scaricato');
          }
          });
    
    str = 'base64 -d '+this.patchDatabase+''+this.dataBName+'.db > '+this.patchDatabase+''+this.dataBName+'Out.db';
    exec2(str, body2, function(error, stdout, stderr) {
          if(error) {
          //this.log('Power function failed', stderr);
          console.log(error);
          } else {
          //       response=stdout;
          //       console.log(response);
          console.log('Convertito');
          }
          // open the database
          let db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                                        if (err) {
                                        console.error(err.message);
                                        }
                                        console.log('Connected to the Samsung database.'+totalMonth);
                                        })
          db.serialize(() => {
                       db.each(`SELECT power_usage as id,
                               date as name
                               FROM power_usage_table`, (err, row) => {
                               if (err) {
                               console.error(err.message);
                               }
                               //    console.log(row.id + "\t" + row.name);
                               row.name=row.name.toString();
                               if(data2!=row.name.substr(0,6)) { //Se la data è diversa memorizza l'ultimo consumo del mese precedente, perchè il calcolo si fa con il dato di energia consumata prima!
                               //parseInt(row.id);
                               contenitore[0]=row.id;
                               }else {
                               // console.log('UGUALE');
                               plusOne++;
                               contenitore[plusOne] = row.id;
                               //     console.log(contenitore[plusOne]);
                               }
                               if(data3!=row.name.substr(0,8)) { //Se la data è diversa memorizza l'ultimo consumo del mese precedente, perchè il calcolo si fa con il dato di energia consumata prima!
                               //parseInt(row.id);
                               contDay[0]=row.id;
                               }else {
                               plusOneDay++;
                               contDay[plusOneDay] = row.id;
                               //   console.log(contDay[plusOneDay]);
                               }
                               });
                       }
                       );
          db.close((err) => {
                   if (err) {
                   console.error(err.message);
                   }
                   console.log('Close the database connection.');
                   totalMonth = (contenitore[plusOne]-contenitore[0])/10;
                   totalDay=contDay[plusOneDay]-contDay[0];
                   console.log('Energia totale spesa nel mese: '+ totalMonth +' Kw');
                   console.log('Energia totale spesa nel giorno: ' + totalDay);
                   self.PowerConsumption = parseFloat(totalDay);
                   totalAll=totalAll+totalMonth;
                   
                   self.totalPowerConsumption = parseFloat(totalMonth);
                   
                   self.PowerConsumption = parseFloat(totalDay);
                   //  self.totalPowerConsumption = parseFloat(totalMonth);
                   //self.service.getCharacteristic(EveTotalPowerConsumption).setValue(self.totalPowerConsumption, undefined, undefined);
                   
                   //           self.service.getCharacteristic(EvePowerConsumption).setValue(self.powerConsumption, undefined, undefined);
                   
                   
                   });
          });
    
    callback(null, this.PowerConsumption);
};

PowerConsumptionAccessory.prototype.getTotalPowerConsumption = function (callback) {
    
callback(null, this.totalPowerConsumption);
};

PowerConsumptionAccessory.prototype.getServices = function () {
    return [this.service];
};
