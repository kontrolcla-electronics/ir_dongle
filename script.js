"use strict";
class serial_class {
    constructor() {
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
        this.counter = 0;
    }
    async init() {
        if ('serial' in navigator) {
            try {
                const port = await navigator.serial.requestPort();
                await port.open({ baudRate: 115200 });
                this.reader = port.readable.getReader();
                this.writer = port.writable.getWriter();
                let signals = await port.getSignals();
                console.log(signals);
            }
            catch (err) {
                console.error('There was an error opening the serial port:', err);
            }
        }
        else {
            console.error('Web serial doesn\'t seem to be enabled in your browser. Try enabling it by visiting:');
            console.error('chrome://flags/#enable-experimental-web-platform-features');
            console.error('opera://flags/#enable-experimental-web-platform-features');
            console.error('edge://flags/#enable-experimental-web-platform-features');
        }
    }
    async write( data_text, data_bytes ) 
    {   const dataArrayBuffer = this.encoder.encode(data_text);
        var result;
        if ( data_bytes != undefined )
            result =  this.add_array_buffers( dataArrayBuffer, data_bytes );
        else
            result = dataArrayBuffer;
        return await this.writer.write(result);
    }
    async read() {
        try {addZero
            const readerData = await this.reader.read();
            this.counter = 0;
            return this.decoder.decode(readerData.value);
        }
        catch (err) {
            const errorMessage = `error reading data: ${err}` + '\r';
            console.error( this.get_time() + ' - ' + this.counter  + ' - ' + errorMessage);
            this.counter++;
            return "$lost$";
        }
    }

    get_time()
    { const d = new Date();
      let h = addZero(d.getHours());
      let m = addZero(d.getMinutes());
      let s = addZero(d.getSeconds());
      let ms = d.getMilliseconds();
      let time = h + ":" + m + ":" + s + '.' + ms;
      return time;
    }

    add_array_buffers(buffer1, buffer2) 
    {   var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
        return tmp.buffer;
    }
}