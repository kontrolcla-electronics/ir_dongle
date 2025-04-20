var ID = function(elementId) {
  return document.getElementById(elementId);
};
//
const area_A = document.getElementsByClassName('t_area_A')[0];
const area_B = document.getElementsByClassName('t_area_B')[0];
const repeat = ID('repeat');
const offset = ID('offset');
const command_num = ID('command_num');
const channel_num = ID('channel_num');
const power_channels = ID('power_channels');
const send_feedback = ID('send_feedback');
const chn_0_bus_option = ID('chn_0_bus_option');
const chn_1_bus_option = ID('chn_1_bus_option');
const chn_2_bus_option = ID('chn_2_bus_option');
//
const container = document.getElementsByClassName('container')[0];
const text_wait = ID('label_wait');
const loader = ID("loader");
const modal = document.getElementsByClassName('modal')[0];
//
var modal_counter = 0;
var links_block = false;
var load_interval = 0;
var ciclic_interval = 0;
var get_serial_interval = 0;
var loaded = false;
//
const max_bytes_recv = 1024;
const max_number_codes_send = 25;
//
const red = "#ee0000";
const green = "#00bb00";

//*******************************************
// LOAD DATA on open port -> callback 0
//*******************************************
function loadData_start() {
  //load_data_index = 0;
  // necessaris per reconnexio serial
  loaded = false;
  clearInterval(ciclic_interval);
  //
  window.setTimeout(loadData("start"), 100);
  load_interval = setInterval( function() { loadData("start"); }, 5000 );
  };

function loadData( value ) {
  if ( loaded == true )
	{	clearInterval(load_interval);
		return;
	}
  var now = get_time();
	var objecte = {};
	objecte.action = "load_data";
	var parametres = JSON.stringify(objecte);
	console.log( now + " - call load data - " + value + ' / ' + parametres);
	// post url, parametres, HttpMethod, call back number
	sendRequest("irlearning/load_data", parametres, "POST", 0 );
  ciclic_timeout();
 }
//*******************************************
// BUTTON LOAD COMMAND -> callback 1
//*******************************************
document.querySelector("#btn_load").addEventListener("click", e => {
  var objecte = {};
  objecte.action = "load_command";
  objecte.num = parseInt(command_num.value);
	var parametres = JSON.stringify(objecte);
	console.log("sent: load command");
	// post url, parametres, HttpMethod, call back number
	sendRequest("irlearning/load_command", parametres, "POST", 1);
});
//*******************************************
//  BUTTON RECORD COMMAND -> callback 2
//*******************************************
document.querySelector("#btn_record").addEventListener("click", e => {
    var clean_string = area_B.value.replace(/\r?\n|\r/g, "");
    var num = parseInt(command_num.value);
    if ( num == 0 )
    { alert("Please select a number from 1 to 32");
      return;
    }
    try {
      // aturo ciclic
      clearInterval(ciclic_interval);
      // objecte a enviar
      var objecte = {}; 
      objecte.action = "record_command";
      objecte.num = num;
      objecte.code_idx = 0;
      objecte.code_total = 0;
      objecte.command = JSON.parse(clean_string);
      objecte.code_total = objecte.command.code.length;
      // check repeat and last value
      if ( objecte.command.repeat > 1 )
      { if ( objecte.command.code[objecte.command.code.length-1][1] < 25000 )
          var r = confirm("Repeat is bigger than 1 and the last code value is smaller than 25000 micro seconds\r\Do you want to set to 25000 to have a safe time between repeat commands?");
          if ( r == true ){
            objecte.command.code[objecte.command.code.length-1][1] = 25000;
          }
      }
      //
      var counter = 0;
      var idx = 0;
      var code_segments = [];
      // a two dimensional array
      code_segments[idx] = [];
      for ( var i = 0; i < objecte.code_total; i++ )
      {   code_segments[idx][counter] = objecte.command.code[i];
          counter++;
          if ( counter >= max_number_codes_send )
          { idx++;
            code_segments[idx] = [];
            counter = 0;
          }
      }
      // send cada 100ms
      const interv = 100;
      for ( var i = 0; i < code_segments.length; i++ )
      {   objecte.command.code = code_segments[i];
          objecte.code_idx = i * max_number_codes_send;
          // important !! let per timeout parametres
          let parametres = JSON.stringify(objecte);
          var timeout = i * interv;
          // post url, parametres, HttpMethod, call back number
          setTimeout( () => {
          sendRequest("irlearning/record_command", parametres, "POST", 2);
          }, timeout);
      }
    } 
    catch(e) {
        alert("Invalid json format:\n" + e );
    }
});
//*******************************************
//  BUTTON SEND COMMNAD TEST -> callback 3
//*******************************************
document.querySelector("#btn_send_to").addEventListener("click", e => {
  var objecte = {};
  objecte.action = "send_command";
  // ir command
  var index_chn_num = channel_num.selectedIndex;
  objecte.cmd_num = parseInt(command_num.value);
  if ( channel_num[index_chn_num].disabled == false )
  {   // descompto valor 0, que es nomes el titol, restant 1
      objecte.chn_num = parseInt(channel_num.value) - 1;
      var parametres = JSON.stringify(objecte);
      console.log("sent: send user command");
      // post url, parametres, HttpMethod, call back number
      sendRequest("irlearning/send_command", parametres, "POST", 3);
  }
  else
    alert("Please select an active channel"); 
});
//*******************************************
//  CICLIC -> callback 4 ( l'inicia en cicle la callback 0 answer )
//*******************************************
function ciclic() 
{ var objecte = {};
  objecte.action = "ciclic";
  var parametres = JSON.stringify(objecte);
  //console.log("status ciclic - " + parametres);
  // post url, parametres, HttpMethod, call back number
  sendRequest("irlearning/ciclic", parametres, "POST", 4);
  ciclic_timeout();
}
//*******************************************
//  SAVE CFG -> callback 5
//*******************************************
document.querySelector("#btn_save_cfg").addEventListener("click", e => {
  container.style.display = "none";
  setTimeout(function () { save_cfg(); }, 200);
});
//
function save_cfg() 
{ var r = confirm("Are you sure you want to save this configuration and restart the device?");
  if ( r == false ){
    container.style.display = "block";
    return;
  }
  container.style.display = "none";
  // dades
  var objecte = {};
  objecte.action = "save_cfg";
  objecte.chn_0_bus_option = chn_0_bus_option.selectedIndex;
  objecte.chn_1_bus_option = chn_1_bus_option.selectedIndex;
  objecte.chn_2_bus_option = chn_2_bus_option.selectedIndex;
  //
  var parametres = JSON.stringify(objecte);
  console.log("call save cfg - "+ parametres);
  // post url, parametres, HttpMethod, call back number
  sendRequest("irlearning/save_cfg", parametres, "POST", 5);
  clearInterval(ciclic_interval);
}
//*******************************************
//  BUTTON ERASE COMMNAD -> callback 6
//*******************************************
document.querySelector("#btn_erase").addEventListener("click", e => {
  var num = parseInt(command_num.value);
  if ( num == 0 )
  { alert("Please select a number from 1 to 32");
    return;
  }
  container.style.display = "none";
  setTimeout(function () { erase_command( num ); }, 200);
});
//
function erase_command( num ) 
{ var r = confirm("Are you sure you want to erase the command number " + num + " ?");
  container.style.display = "block";
  if ( r == false ){
    return;
  }
  var objecte = {};
  objecte.action = "erase_command";
  objecte.num = num;
  var parametres = JSON.stringify(objecte);
  console.log("sent: erase user command");
  // post url, parametres, HttpMethod, call back number
  sendRequest("irlearning/erase_command", parametres, "POST", 6);
}
//*******************************************
//	SEND - mantinc url i httpMethod per legacy amb ethernet - no es fan servir
//*******************************************
function sendRequest( url, params, HttpMethod, number ) {
  send_serial(number, params);
  links_block = true;
}
//*******************************************
function send_serial( number, params )
{ var now = get_time();
  if ( get_serial_interval == 0 )
  { console.log( now + " - no serial connection");
    return;
  }
  // afegim capselera
  var len = params.length;
  var len_hex = ('0000' + len.toString(16).toUpperCase()).slice(-4);
  var frame = "POST_" + len_hex;
  // LOAD DATA - callback 0
  if ( number == 0 )
    frame += "_ir_load:";
  // LOAD COMMAND - callback 1
  else if ( number == 1 )
    frame += "_ir_load_command:";
  // RECORD COMMAND - callback 2
  else if ( number == 2 )
    frame += "_ir_record_command:";
  // SEND COMMAND TEST - callback 3
  else if ( number == 3 )
    frame += "_ir_send_command:";
  // CICLIC - callback 4
  else if ( number == 4 )
    frame += "_ir_ciclic:";
  // SAVE CFG - callback 5
  else if ( number == 5 )
    frame += "_ir_save_cfg:";
  // ERASE COMMAND - callback 6
  else if ( number == 6 )
    frame += "_ir_erase_command:";
  else 
    return;
  frame += params;
  serial_obj.write(frame);
  console.log( now + " - serial_write - " + frame );
}
//*******************************************
const serial_obj = new serial_class();
const connect = document.getElementById('connect');
const recv_div = document.getElementById('recv_div');

connect.addEventListener('pointerdown', () => {
  serial_obj.init().then(() => 
    { get_serial_interval = window.setInterval(getSerialMessage, 100) 
      console.log ( "open port" );
      container.style.display = "block";
      loadData_start();
      closeModal();
    }); 
});

var data_recv = "";
var data_saved = "";
var data_array = [];

async function getSerialMessage() 
{ var data = await serial_obj.read();
  if( data == "$lost$" )
  { clearInterval(get_serial_interval);
    get_serial_interval = 0;
    window.setTimeout(openModal(), 2000);
    links_block = false;
    return;
  }
  //console.log ( "recv data len: " + data.length );
  var index = data.indexOf('\r');
  while ( index != -1 )
  { data_recv = data_saved;
    data_recv += data.slice(0, index);
    // quedara
    data_saved = "";
    data = data.slice(index+1);
    // task parse
    var now = get_time();
    console.log ( now + " - serial_recv: " + data_recv + '\n' );
    console.log ( now + " - serial_recv_len: " + data_recv.length + '\n' );
    parse_frame(data_recv);
    // check again
    index = data.indexOf('\r');
  }
  if ( data )    
  { // es part del frame
    data_saved += data;
  }
  // per seguretat
  if ( data_saved.length > max_bytes_recv )
  { console.log ( now + " - serie recv overflow: emptied\n" );
    data_saved = "";
  }
}
async function serial_to_screen_debug() 
{ data_array.push( data_recv );
  //
  while ( data_array.length > 20 )
  {   data_array.shift();
  }
  recv_div.innerText = data_array.join('\r');
}

function addZero(i) {
  if (i < 10) {i = "0" + i}
  return i;
}
function get_time()
{ const d = new Date();
  let h = addZero(d.getHours());
  let m = addZero(d.getMinutes());
  let s = addZero(d.getSeconds());
  let time = h + ":" + m + ":" + s;
  return time;
}
//*******************************************
// CALLBACKS
//*******************************************
function parse_frame(frame) 
{ var data = JSON.parse(frame);
  if ( data != "") 
  { if ( data.action == "load_data" )
      callback_load_data(data);
    else if ( data.action == "load_command" )
      callback_load_command(data);
    else if ( data.action == "record_command" )
      callback_record_command(data);
    else if ( data.action == "send_command" )
      callback_send_command(data);
    else if ( data.action == "ciclic" )
      callback_ciclic(data);
    else if ( data.action == "save_cfg" )
      callback_save_cfg(data);
    else if ( data.action == "learned_code" )
      received_learned_code(data);
    else if ( data.action == "erase_command" )
      callback_erase_command(data);
  } 
}
//*******************************************
// CALLBACK 0 - LOAD DATA
function callback_load_data( data ) 
{ // {"action":"load_data","received":"successfully","boot":"0xx.000.00.00x",
  // "firm":"050.000.00.039.4","chn_0_bus_option":4,"chn_1_bus_option":4,
  // "chn_2_bus_option":3,"model":4,"power_channels":1}
  if ( data.received == "successfully") 
  {   loaded = true;
      if ( data.chn_0_bus_option != undefined )
        chn_0_bus_option.selectedIndex = data.chn_0_bus_option;
      if ( data.chn_1_bus_option != undefined )
        chn_1_bus_option.selectedIndex = data.chn_1_bus_option;
      if ( data.chn_2_bus_option != undefined )
        chn_2_bus_option.selectedIndex = data.chn_2_bus_option;
      // start ciclic
      window.setTimeout(ciclic, 500);
      ciclic_interval = window.setInterval(ciclic, 5000);
  }
}
//*******************************************
// CALLBACK 1 - BUTTON LOAD COMMAND
function callback_load_command( data )
{   if ( data.hasOwnProperty("error_num"))
    { if ( data.error_num != 0 )
      { error_check( data );
        return;
      }
    }
    var num = parseInt(command_num.value);
    if (data.received == "successfully" && data.num == num ) 
    {   area_B.value += JSON.stringify(data.command) + '\r';
        var user_number = "number " + data.num;
        if ( data.num == 0 )
          user_number = "example";
        setTimeout(() => {
          alert("User command " + user_number + " loaded");
        }, 300);
    }
    else
      alert("Load user command failed");
    links_block = false;
}
//*******************************************
// CALLBACK 2 - BUTTON RECORD COMMAND
function callback_record_command ( data ) 
{   if ( data.hasOwnProperty("error_num"))
    { if ( data.error_num != 0 )
      { error_check( data );
        return;
      }
    }
    var num = parseInt(command_num.value);
    if ( data.received == "successfully" && data.num == num )
    {   alert("User command number " + data.num + " recorded");
    }
    else
      alert("Record user command failed");
    links_block = false;
    // re inicio ciclic
    ciclic_interval = window.setInterval(ciclic, 5000);
}
//******************************************
//  CALLBACK 3 - BUTTON SEND COMMNAD TEST 
function callback_send_command( data ) 
{ if ( data.hasOwnProperty("error_num"))
  { if ( data.error_num != 0 )
    { error_check( data );
      return;
    }
  }
  var num = parseInt(command_num.value);
  if ( data.received == "successfully" && data.num == num )
  {   send_feedback.innerHTML = "User command number " + data.num + " sent";
      window.setTimeout( send_feedback_clear, 600);
  }
  else
    alert("Send user command failed");
  links_block = false;
}
function send_feedback_clear() 
{   send_feedback.innerHTML = "";
}
//*******************************************
// CALLBACK 4 - CICLIC
function callback_ciclic(data) {
  if ( data.received == "successfully") 
  { closeModal();
    //console.log("callback_4_ciclic: " + data.received);
    if ( data.hasOwnProperty("error_num"))
    { if ( data.error_num != 0 )
      { container_wait.style.display = "none";
        error_check( data );
        container.style.display = "block";
        return;
      }
    }
    if ( data.power_channels != undefined ) 
    { if ( data.power_channels == 1) 
        power_channels.style.background = green;
      else 
        power_channels.style.background = red;
    }
    links_block = false;
  }
}
//*******************************************
// CALLBACK 5 - SAVE CFG
function callback_save_cfg(data) 
{ if ( data.hasOwnProperty("error_num"))
  { if ( data.error_num != 0 )
    { error_check( data );
      return;
    }
  }
  if ( data.received != "successfully" )
    alert("Save config failed");   
  links_block = false;
}
//*******************************************
// CALLBACK 6 - BUTTON ERASE COMMAND
function callback_erase_command ( data ) 
{   if ( data.hasOwnProperty("error_num"))
    { if ( data.error_num != 0 )
      { error_check( data );
        return;
      }
    }
    var num = parseInt(command_num.value);
    if ( data.received == "successfully" && data.num == num )
    {   alert("User command number " + data.num + " erased");
    }
    else
      alert("Erase user command failed");
    links_block = false;
}
//*******************************************
// RECEIVED LEARNED CODE
function received_learned_code(data) {
  if ( data.received == "successfully") 
  { closeModal();
    //sconsole.log("callback_6_learned_code: " + data.received);
    if ( data.hasOwnProperty("error_num"))
    { if ( data.error_num != 0 )
      { container_wait.style.display = "none";
        error_check( data );
        container.style.display = "block";
        return;
      }
    }
    if ( data.commands != undefined ) 
    { for ( var i=0; i<data.commands.length; i++ )
        area_A.value += JSON.stringify(data.commands[i])+ "\n\n";
    }
    links_block = false;
  }
}
//*********
// CLEAR ALWAYS TEXT AREA B IN LOAD
document.addEventListener("DOMContentLoaded", () => {
	area_B.value = "";
});
//*********
//  BUTTON CLEAR A AREA
document.querySelector("#btn_clear_A").addEventListener("click", e => {
  area_A.value = "";
});
//*********
//  BUTTON CLEAR B AREA
document.querySelector("#btn_clear_B").addEventListener("click", e => {
  area_B.value = "";
});
//*********
//  BUTTON TO EDIT AREA
document.querySelector("#btn_edit").addEventListener("click", e => {
  // el copio per parts per insertar repeat i offset a la seva "posicio"
  try {
    var aux = JSON.parse(area_A.value);
    var edit = {};
    edit.frequency = aux.frequency;
    edit.repeat = parseInt(repeat.value);
    edit.offset = parseInt(offset.value);
    edit.code = aux.code;
    area_B.value += JSON.stringify(edit)
  }
  catch(e) {
    alert("Invalid single json format:\n" + e );
  }
});
//*********
//  BUTTON DOWNLOAD COMMAND JSON
document.querySelector("#btn_download").addEventListener("click", e => {
  console.log("click download user area");
  window.setTimeout(download, 500); 
});
function download() {
  // https://stackoverflow.com/questions/57709550/how-to-download-text-from-javascript-variable-on-all-browsers
  const clean_string = area_B.value.replace(/\r?\n|\r/g, "");
  try 
  { // only to check if is a valid json
    var command_json = JSON.parse(clean_string);
  }
  catch(e) 
  { alert("Invalid json format:\n" + e );
    return;
  }
  const type = "application/json";
  let num = parseInt(command_num.value)
  if ( num == 0 )
    num ="example";
  const filename = "user_command_" + num + ".json";
  // create an invisible A element
  const a = document.createElement('A');
  a.style.display = "none";
  document.body.appendChild(a);
  // set the HREF to a Blob representation of the data to be downloaded
  a.href = window.URL.createObjectURL( new Blob( [clean_string], { type } ) );
  // use download attribute to set set desired file name
  a.setAttribute("download", filename);
  // trigger the download by simulating click
  a.click();
  // cleanup
  window.URL.revokeObjectURL(a.href);
  document.body.removeChild(a);
};
//*********
//  ERROR CHECK
function error_check( data ) {
  if ( data.hasOwnProperty("error_text"))
    alert("Error: " + data.error_text);
  else
    alert("Error number " + data.error_num);
}
// MODAL Open
function openModal() {
  modal.style.display = "block";
}
// MODAL Close
function closeModal() {
  modal.style.display = "none";
  modal_counter = 0;
}
//*********
//  WAITING UPDATE/RECORD
function waiting(){
  var i = 49;
  setInterval(function(){ 
    if (i < 10 ){    
      loader.style.display = "none";
      location.reload();
    }
    i--;
    }, 100);
}
//*********
//  FOLLOW THE LINKS ?
window.addEventListener("click", e => {
  if ( links_block == true )
  { if (e.target.nodeName === 'A') {
    e.preventDefault();
    }
  }
});
function ciclic_timeout() {
  modal_counter++;
  // 4 * 5 = 20s
  if ( modal_counter == 4 )
    openModal();
  links_block = false;
}
//*******
openModal();