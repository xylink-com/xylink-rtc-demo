class FullScreen{
    private doc:any = window.document;;
    private docEl:any;
    private requestFullScreen:any;
    private cancelFullScreen:any;
    static instance: any;

    constructor () {
        this.cancelFullScreen = this.doc.exitFullscreen || this.doc.mozCancelFullScreen || this.doc.webkitExitFullscreen || this.doc.msExitFullscreen;
        this.requestFullScreen = this.doc.requestFullscreen || this.doc.mozRequestFullScreen || this.doc.webkitRequestFullScreen || this.doc.msRequestFullscreen;
    }

    static getInstance() {
        if(!this.instance) {
            this.instance = new FullScreen();
        }
        return this.instance;
    }

    getFullscreenElement() {
        return  this.doc.fullscreenElement ||
        this.doc.mozFullScreenElement ||
        this.doc.msFullScreenElement ||
        this.doc.webkitFullscreenElement||null;
    }

    init(docEl:any){
        this.requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;

        if(this.docEl !== docEl){
            this.docEl = docEl;
        }
    }
    toggleFullScreen(docEl:any){
        this.init(docEl);
        if (this.getFullscreenElement() === docEl) {
            this.cancelFullScreen.call(this.doc);
        }
        else {
            this.requestFullScreen.call(docEl);
        }
    }
    getFullStatus(docEl:any) {
        return  docEl && this.getFullscreenElement() === docEl;
    }

}

export default FullScreen.getInstance();