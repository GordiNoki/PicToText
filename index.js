// should make pics 60x60 tho

var canvases = {
    Picture: window.document.createElement("canvas"),
    Gray: window.document.createElement("canvas"),
    Lines: window.document.createElement("canvas"),
    Mono: window.document.createElement("canvas")
}

Object.values(canvases).forEach(canv => { canv.height = 60; canv.width = 60 })

var PictureCtx = canvases.Picture.getContext("2d");
var GrayCtx = canvases.Gray.getContext("2d");
var LinesCtx = canvases.Lines.getContext("2d");
var MonoCtx = canvases.Mono.getContext("2d");

var w = PictureCtx.canvas.width;
var h = PictureCtx.canvas.height;

window.document.getElementById("UseLine").onclick = (ev) => {
    var power = window.document.getElementById("power").value
    var data = (ev.target.checked ? LinesCtx : GrayCtx).getImageData(0, 0, w, h).data.filter((_, i) => i % 4 == 0)
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            a = (x + (y * w))
            if (ev.target.checked) {
                MonoCtx.fillStyle = parseInt(data[a]) > 255 / power ? "#000" : "#FFF"
            } else {
                MonoCtx.fillStyle = parseInt(data[a]) > 255 / power ? "#FFF" : "#000"
            }
            MonoCtx.fillRect(x, y, 1, 1)
        }
    }
}

window.document.getElementById("power").oninput = (ev) => {
    var power = ev.target
    var isLines = window.document.getElementById("UseLine").checked
    var data = (isLines ? LinesCtx : GrayCtx).getImageData(0, 0, w, h).data.filter((_, i) => i % 4 == 0)
    for (var x = 0; x < w; x++) {
        for (var y = 0; y < h; y++) {
            a = (x + (y * w))
            c1 = InvertColor.checked ? "#000" : "#FFF"
            c2 = InvertColor.checked ? "#FFF" : "#000"
            var fStyle;
            if (isLines) {
                fStyle = parseInt(data[a]) > 255 / power.value ? c2 : c1
            } else {
                fStyle = parseInt(data[a]) > 255 / power.value ? c1 : c2
            }
            MonoCtx.fillStyle = fStyle
            MonoCtx.fillRect(x, y, 1, 1)
            MonoPreview.getContext("2d").fillStyle = fStyle
            MonoPreview.getContext("2d").fillRect(x * 2, y * 2, 2, 2)
        }
    }
}

window.document.getElementById("Export").onclick = () => {
    var MonoData = MonoCtx.getImageData(0, 0, w, h).data.filter((_, i) => i % 4 == 0).map(s => s == 255 ? 1 : 0)
    var input = Array.from(MonoData)
    var PixelMap = []
    for (var i = 0; i < 60; i++) {
        PixelMap.push(input.slice(i * 60, 60 + (i * 60)))
    }

    var out = ""

    for (var y = 0; y < 15; y++) {
        var Segment = PixelMap.splice(0, 4)
        for (var x = 0; x < 30; x++) {
            var charCode = []
            Segment.forEach(line => {
                charCode.push(...line.slice(x * 2, 2 + x * 2))
            })
            if (braileFont[charCode.join(",")] == undefined) console.log(charCode.join(","))
            else out += braileFont[charCode.join(",")]
        }
        out += "\n"
    }
    window.document.getElementById("OutputBox").innerText = out
}

ImageInput.onchange = (ev) => {
    if (ev.target.files.length < 0) return
    var image = window.document.createElement("img");
    image.src = URL.createObjectURL(ev.target.files[0]);
    image.crossOrigin = "anonymous"
    image.onload = () => {
        PicturePreview.getContext("2d").drawImage(image, 0, 0, 120, 120)
        PictureCtx.drawImage(image, 0, 0, w, h)
        function getData(data, x, y) {
            if (x < 0 || x > w - 1) return 255
            if (y < 0 || y > h - 1) return 255
            return data[x + (y * w)]
        }
        // z1 z2 z3
        // z4 z5 z6
        // z7 z8 z9
        function getSobelMask(data, x, y) {
            z1 = getData(data, x - 1, y - 1)
            z2 = getData(data, x, y - 1)
            z3 = getData(data, x + 1, y - 1)
            z4 = getData(data, x - 1, y)
            z5 = getData(data, x, y)
            z6 = getData(data, x + 1, y)
            z7 = getData(data, x - 1, y + 1)
            z8 = getData(data, x, y + 1)
            z9 = getData(data, x + 1, y + 1)
            gx = (z7 + (2 * z8) + z9) - (z1 + (2 * z2) + z3)
            gy = (z3 + (2 * z6) + z9) - (z1 + (2 * z4) + z7)
            return Math.sqrt(Math.pow(gx, 2) + Math.pow(gy, 2))
        }

        function getPrevitMask(data, x, y) {
            z1 = getData(data, x - 1, y - 1)
            z2 = getData(data, x, y - 1)
            z3 = getData(data, x + 1, y - 1)
            z4 = getData(data, x - 1, y)
            z5 = getData(data, x, y)
            z6 = getData(data, x + 1, y)
            z7 = getData(data, x - 1, y + 1)
            z8 = getData(data, x, y + 1)
            z9 = getData(data, x + 1, y + 1)
            gx = (z7 + z8 + z9) - (z1 + z2 + z3)
            gy = (z3 + z6 + z9) - (z1 + z4 + z7)
            return Math.sqrt(Math.pow(gx, 2) + Math.pow(gy, 2))
        }

        function getRobertsMask(data, x, y) {
            z1 = getData(data, x - 1, y - 1)
            z2 = getData(data, x, y - 1)
            z3 = getData(data, x + 1, y - 1)
            z4 = getData(data, x - 1, y)
            z5 = getData(data, x, y)
            z6 = getData(data, x + 1, y)
            z7 = getData(data, x - 1, y + 1)
            z8 = getData(data, x, y + 1)
            z9 = getData(data, x + 1, y + 1)
            gx = (z9 - z5)
            gy = (z8 - z6)
            return Math.sqrt(Math.pow(gx, 2) + Math.pow(gy, 2))
        }

        var PicData = PictureCtx.getImageData(0, 0, w, h).data
        for (var x = 0; x < w; x++) {
            for (var y = 0; y < h; y++) {
                a = (x + (y * w)) * 4
                i = (PicData[a] * 0.2125) + (PicData[a + 1] * 0.7154) + (PicData[a + 2] * 0.0721)
                GrayCtx.fillStyle = `rgb(${i}, ${i}, ${i})`
                GrayCtx.fillRect(x, y, 1, 1)
            }
        }
        var GrayData = GrayCtx.getImageData(0, 0, w, h).data.filter((_, i) => i % 4 == 0)
        for (var x = 0; x < w; x++) {
            for (var y = 0; y < h; y++) {
                a = (x + (y * w))
                i = getSobelMask(GrayData, x, y) / 1000 * GrayData[a]
                LinesCtx.fillStyle = `rgb(${i}, ${i}, ${i})`
                LinesCtx.fillRect(x, y, 1, 1)
            }
        }
        var power = window.document.getElementById("power")
        var isLines = window.document.getElementById("UseLine").checked
        var data = (isLines ? LinesCtx : GrayCtx).getImageData(0, 0, w, h).data.filter((_, i) => i % 4 == 0)
        for (var x = 0; x < w; x++) {
            for (var y = 0; y < h; y++) {
                a = (x + (y * w))
                c1 = InvertColor.checked ? "#000" : "#FFF"
                c2 = InvertColor.checked ? "#FFF" : "#000"
                var fStyle;
                if (isLines) {
                    fStyle = parseInt(data[a]) > 255 / power.value ? c2 : c1
                } else {
                    fStyle = parseInt(data[a]) > 255 / power.value ? c1 : c2
                }
                MonoCtx.fillStyle = fStyle
                MonoCtx.fillRect(x, y, 1, 1)
                MonoPreview.getContext("2d").fillStyle = fStyle
                MonoPreview.getContext("2d").fillRect(x * 2, y * 2, 2, 2)
            }
        }
    }
}