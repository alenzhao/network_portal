/* isblogo.js - see README and LICENSE for details */
var isblogo;
if (!isblogo) {
    isblogo = {};
}
(function () {
    "use strict";
    // some default settings
    var MARGIN_LEFT = 20, MARGIN_TOP = 20, MARGIN_RIGHT = 20,
        MARGIN_BOTTOM = 30, DEFAULT_OPTIONS, SVG_NS, GLYPH_COLORS, MEASURE_CANVAS;
    SVG_NS = 'http://www.w3.org/2000/svg';
    GLYPH_COLORS = {
        'A': 'rgb(0, 200, 50)',
        'G': 'rgb(230, 200, 0)',
        'T': 'rgb(255, 0, 0)',
        'C': 'rgb(0, 0, 230)'
    };
    DEFAULT_OPTIONS = {
        type: 'canvas',
        width: 400,
        height: 300,
        glyphStyle: '20pt Helvetica'
    };
    MEASURE_CANVAS = document.createElement('canvas');
    MEASURE_CANVAS.setAttribute('width', 500);
    MEASURE_CANVAS.setAttribute('height', 500);

    // **********************************************************************
    // ****** Common Functions
    // **********************************************************************

    function rank(arr) {
        var result = [], i;
        for (i = 0; i < arr.length; i += 1) {
            result.push([i, arr[i]]);
        }
        return result.sort(function (a, b) {
            return a[1] - b[1];
        });
    }

    function log(n, base) {
        return Math.log(n) / Math.log(base);
    }
    function uncertaintyAt(pssm, motifPos) {
        var row, freq, sum = 0;
        for (row = 0; row < pssm.values[motifPos].length; row += 1) {
            freq = pssm.values[motifPos][row];
            if (freq > 0) {
                sum +=  freq * log(freq, 2);
            }
        }
        return -sum;
    }
    function rsequence(pssm, motifPos) {
        var correctionFactor = 0.0;
        return 2 - (uncertaintyAt(pssm, motifPos) + correctionFactor);
    }

    // Generic PSSM drawing function
    function drawPSSM(pssm, scalex, y0, yHeight, drawFun) {
        var x, y, motifPos, size, columnRanks, currentGlyph, row, maxWidth, rseq, oldy, scalex;
        x = MARGIN_LEFT;
        
        for (motifPos = 0; motifPos < pssm.values.length; motifPos += 1) {
            y = y0;
            columnRanks = rank(pssm.values[motifPos]);
            maxWidth = 0;
            rseq = rsequence(pssm, motifPos);
            for (row = 0; row < columnRanks.length; row += 1) {
                currentGlyph = pssm.alphabet[columnRanks[row][0]];
                size = drawFun(currentGlyph, x, y, scalex, yHeight, rseq * columnRanks[row][1]);
                if (size.width > maxWidth) {
                    maxWidth = size.width;
                }
                oldy = y;
                y -= size.height;
            }
            x += maxWidth;
        }
    }

    // **********************************************************************
    // ****** Canvas-based Implementation
    // **********************************************************************
    /*
     * This method works fine as a first approximation, but is not exact enough
     * What we actually need to do is to print it out and measure after drawing
     */
/*
    function textHeightCanvas(text) {
        var body = document.getElementsByTagName("body")[0], dummy, dummyText, result;
        dummy = document.createElement("div");
        dummyText = document.createTextNode(text);
        dummy.appendChild(dummyText);
        dummy.setAttribute("style", 'Helvetica 20pt');
        body.appendChild(dummy);
        result = dummy.offsetHeight;
        body.removeChild(dummy);
        return result;
    }
*/
    function firstLine(imageData) {
        var pixels = imageData.data, row, col, index;
        for (row = 0; row < imageData.height; row += 1) {
            for (col = 0; col < imageData.width; col += 1) {
                index = (row * imageData.width * 4) + col * 4;
                if (pixels[index + 3] !== 0) {
                    return row;
                }
            }
        }
    }
    function lastLine(imageData) {
        var pixels = imageData.data, row, col, index;
        for (row = imageData.height - 1; row >= 0; row -= 1) {
            for (col = 0; col < imageData.width; col += 1) {
                index = (row * imageData.width * 4) + col * 4;
                if (pixels[index + 3] !== 0) {
                    return row;
                }
            }
        }
    }

    function measureText(text, font, scalex, scaley) {
        var imageData, context, first;
        if (scaley === 0) {
            return 0;
        }
        context = MEASURE_CANVAS.getContext('2d');
        context.fillStyle = "rgb(0, 0, 0)";
        context.font = font;
        context.textBaseline = 'top';
        context.save();
        context.scale(scalex, scaley);
        context.fillText(text, 0, 0);
        context.restore();

        imageData = context.getImageData(0, 0, MEASURE_CANVAS.width, MEASURE_CANVAS.height);
        first = firstLine(imageData);
        context.clearRect(0, 0, MEASURE_CANVAS.width, MEASURE_CANVAS.height);
        return lastLine(imageData) - first + 1;
    }

/*
    function drawLabelsX(context, startx, y) {
        context.font = '12pt Arial';
        var intervalDistance, x, textHeight, i, label, labelWidth, transx, transy;
        intervalDistance = 20;
        x = startx;
        textHeight = textHeightCanvas('M');

        for (i = 10; i < 150; i += 10) {
            context.save();
            label = i.toString();
            labelWidth = context.measureText(label).width;
            transx = x + labelWidth / 2.0;
            transy = y - textHeight / 2.0;
            context.translate(transx, transy);
            context.rotate(-Math.PI / 2);
            context.translate(-transx, -transy);
            context.fillText(label, x, y);
            x += intervalDistance;
            context.restore();
        }
    }
    function drawLabelsY(context, x, y) {
        var i, label;
        context.font = '12pt Arial';
        for (i = 1; i <= 8; i += 1) {
            label = i.toString();
            context.fillText(label, x, y);
            y -= 20;
        }
    }
*/

    function drawScale(canvas) {
        var context, right, bottom;
        context = canvas.getContext('2d');
        right = canvas.width - MARGIN_RIGHT;
        bottom = canvas.height - MARGIN_BOTTOM;

        //drawLabelsX(context, MARGIN_LEFT, canvas.height);
        //drawLabelsY(context, 0, bottom);
        context.beginPath();
        context.moveTo(MARGIN_LEFT, MARGIN_TOP);
        context.lineTo(MARGIN_LEFT, bottom);
        context.lineTo(right, bottom);
        context.stroke();
    }

    function drawGlyph(context, glyph, x, y, scalex,
                       yHeight, maxFontHeightNormal, weight) {
        var glyphWidth, scaley, glyphHeightScaled;
        glyphWidth = context.measureText(glyph).width * scalex;
        scaley = weight * (yHeight / maxFontHeightNormal) * 0.65;
        glyphHeightScaled = measureText(glyph, context.font, scalex, scaley);
        if (scaley > 0) {
            context.fillStyle = GLYPH_COLORS[glyph];
            context.save();
            context.translate(x, y);
            context.scale(scalex, scaley);
            context.translate(-x, -y);
            context.fillText(glyph, x, y);
            context.restore();
        }
        return { width: glyphWidth, height: glyphHeightScaled };
    }

    function drawGlyphs(canvas, options, pssm) {
        var context, yHeight, maxFontHeightNormal, sumColumnWidthsNormal, xWidth, scalex;
        context = canvas.getContext('2d');
        context.textBaseline = 'alphabetic';
        context.font = options.glyphStyle;
        yHeight = canvas.height - (MARGIN_BOTTOM + MARGIN_TOP);
        maxFontHeightNormal = measureText('Mg', context.font, 1.0, 1.0);
        sumColumnWidthsNormal = context.measureText('W').width * pssm.values.length;
        xWidth = canvas.width - (MARGIN_LEFT + MARGIN_RIGHT);
        scalex = xWidth / sumColumnWidthsNormal;

        drawPSSM(pssm, scalex,
                 canvas.height - MARGIN_BOTTOM, yHeight,
                 function (currentGlyph, x, y, scalex, yHeight, weight) {
                return drawGlyph(context, currentGlyph, x, y, scalex, yHeight,
                                 maxFontHeightNormal, weight);
            });
    }

    function makeCanvas(id, options, pssm) {
        var canvas = document.createElement("canvas"), elem;
        canvas.id = id;
        canvas.setAttribute('width', options.width);
        canvas.setAttribute('height', options.height);
        canvas.setAttribute('style', 'border: 1px solid black');
        elem = document.getElementById(id);
        elem.parentNode.replaceChild(canvas, elem);
        drawScale(canvas);
        drawGlyphs(canvas, options, pssm);
    }

    // **********************************************************************
    // ****** Public API
    // **********************************************************************

    isblogo.makeLogo = function (id, pssm, options) {
        if (options === null) {
            options = DEFAULT_OPTIONS;
        }
        // TODO: copy the options from DEFAULT_OPTIONS that are missing        
        makeCanvas(id, options, pssm);
    };
}());